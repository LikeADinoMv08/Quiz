# Quiz[quiz_system.py](https://github.com/user-attachments/files/25750502/quiz_system.py)
"""
Sistema de Questionários em Python
Plataforma completa para criação e gerenciamento de questionários
"""

from flask import Flask, render_template_string, request, jsonify, session, redirect, url_for
from datetime import datetime, timedelta
import json
import random
import string
import os
from functools import wraps

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Banco de dados em memória (em produção, use um banco de dados real)
users = [
    {'email': 'admin@quiz.com', 'password': '123456', 'name': 'Administrador'},
    {'email': 'professor@escola.com', 'password': 'prof123', 'name': 'Professor Silva'}
]

quizzes = []
responses = []
activity_logs = []


def generate_access_code(length=6):
    """Gera código de acesso aleatório"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def require_login(f):
    """Decorator para rotas que requerem autenticação"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function


def send_email_alert(creator_email, respondent_name, respondent_email, quiz_title, action):
    """Simula envio de email (em produção, use um serviço real de email)"""
    print(f"[EMAIL ALERT] Para: {creator_email}")
    print(f"  Respondente: {respondent_name} ({respondent_email})")
    print(f"  Questionário: {quiz_title}")
    print(f"  Ação: {action}")
    print("-" * 50)


@app.route('/')
def home():
    """Página inicial"""
    return render_template_string(HOME_TEMPLATE)


@app.route('/register', methods=['GET', 'POST'])
def register():
    """Cadastro de novos usuários"""
    if request.method == 'POST':
        data = request.get_json()
        
        # Validações
        if len(data['password']) < 6:
            return jsonify({'success': False, 'message': 'Senha deve ter no mínimo 6 caracteres'})
        
        if data['password'] != data['confirmPassword']:
            return jsonify({'success': False, 'message': 'Senhas não coincidem'})
        
        if any(u['email'].lower() == data['email'].lower() for u in users):
            return jsonify({'success': False, 'message': 'Email já cadastrado'})
        
        # Criar novo usuário
        new_user = {
            'email': data['email'],
            'password': data['password'],
            'name': data['name']
        }
        users.append(new_user)
        
        return jsonify({'success': True, 'message': 'Cadastro realizado com sucesso!'})
    
    return render_template_string(REGISTER_TEMPLATE)


@app.route('/login/creator', methods=['GET', 'POST'])
def login_creator():
    """Login para criadores"""
    if request.method == 'POST':
        data = request.get_json()
        
        user = next((u for u in users if u['email'].lower() == data['email'].lower() 
                    and u['password'] == data['password']), None)
        
        if user:
            session['user'] = {
                'email': user['email'],
                'name': user['name'],
                'role': 'creator'
            }
            return jsonify({'success': True})
        
        return jsonify({'success': False, 'message': 'Email ou senha incorretos'})
    
    return render_template_string(LOGIN_CREATOR_TEMPLATE)


@app.route('/login/respondent', methods=['GET', 'POST'])
def login_respondent():
    """Login para respondentes"""
    if request.method == 'POST':
        data = request.get_json()
        
        # Buscar questionário pelo código
        quiz = next((q for q in quizzes if q['accessCode'].upper() == data['accessCode'].upper()), None)
        
        if not quiz:
            return jsonify({'success': False, 'message': 'Código inválido'})
        
        if not quiz['active']:
            return jsonify({'success': False, 'message': 'Questionário encerrado'})
        
        # Verificar prazo
        if quiz.get('dueDate'):
            due_date = datetime.fromisoformat(quiz['dueDate'])
            if datetime.now() > due_date and not quiz.get('allowLateSubmissions', False):
                return jsonify({'success': False, 'message': 'Prazo encerrado'})
        
        # Criar sessão do respondente
        session['user'] = {
            'email': data['email'],
            'name': data['name'],
            'role': 'respondent'
        }
        session['active_quiz_id'] = quiz['id']
        
        return jsonify({'success': True, 'quiz_id': quiz['id']})
    
    # Listar questionários ativos
    active_quizzes = [q for q in quizzes if q['active']]
    return render_template_string(LOGIN_RESPONDENT_TEMPLATE, quizzes=active_quizzes)


@app.route('/dashboard')
@require_login
def dashboard():
    """Dashboard do criador"""
    if session['user']['role'] != 'creator':
        return redirect(url_for('home'))
    
    user_quizzes = [q for q in quizzes if q['creatorEmail'] == session['user']['email']]
    return render_template_string(DASHBOARD_TEMPLATE, quizzes=user_quizzes)


@app.route('/quiz/create', methods=['GET', 'POST'])
@require_login
def create_quiz():
    """Criar novo questionário"""
    if session['user']['role'] != 'creator':
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        data = request.get_json()
        
        if not data['title'] or not data['questions']:
            return jsonify({'success': False, 'message': 'Preencha todos os campos obrigatórios'})
        
        # Criar questionário
        access_code = generate_access_code()
        new_quiz = {
            'id': len(quizzes) + 1,
            'title': data['title'],
            'description': data.get('description', ''),
            'questions': data['questions'],
            'active': data.get('active', True),
            'dueDate': data.get('dueDate'),
            'allowLateSubmissions': data.get('allowLateSubmissions', False),
            'accessCode': access_code,
            'creatorEmail': session['user']['email'],
            'creatorName': session['user']['name'],
            'createdAt': datetime.now().isoformat()
        }
        
        quizzes.append(new_quiz)
        
        return jsonify({
            'success': True, 
            'message': f'Questionário criado! Código: {access_code}',
            'accessCode': access_code
        })
    
    return render_template_string(CREATE_QUIZ_TEMPLATE)


@app.route('/quiz/<int:quiz_id>')
@require_login
def view_quiz(quiz_id):
    """Visualizar questionário"""
    quiz = next((q for q in quizzes if q['id'] == quiz_id), None)
    
    if not quiz:
        return "Questionário não encontrado", 404
    
    # Se for criador, mostrar detalhes completos
    if session['user']['role'] == 'creator':
        if quiz['creatorEmail'] != session['user']['email']:
            return "Acesso negado", 403
        
        # Buscar respostas
        quiz_responses = [r for r in responses if r['quizId'] == quiz_id]
        
        return render_template_string(QUIZ_DETAILS_TEMPLATE, quiz=quiz, responses=quiz_responses)
    
    # Se for respondente, mostrar formulário
    return render_template_string(ANSWER_QUIZ_TEMPLATE, quiz=quiz)


@app.route('/quiz/<int:quiz_id>/submit', methods=['POST'])
@require_login
def submit_quiz(quiz_id):
    """Enviar respostas do questionário"""
    if session['user']['role'] != 'respondent':
        return jsonify({'success': False, 'message': 'Acesso negado'})
    
    quiz = next((q for q in quizzes if q['id'] == quiz_id), None)
    if not quiz:
        return jsonify({'success': False, 'message': 'Questionário não encontrado'})
    
    data = request.get_json()
    
    # Verificar se está atrasado
    is_late = False
    if quiz.get('dueDate'):
        due_date = datetime.fromisoformat(quiz['dueDate'])
        is_late = datetime.now() > due_date
    
    # Salvar resposta
    response = {
        'id': len(responses) + 1,
        'quizId': quiz_id,
        'respondentName': session['user']['name'],
        'respondentEmail': session['user']['email'],
        'answers': data['answers'],
        'submittedAt': datetime.now().isoformat(),
        'isLateSubmission': is_late,
        'activityLog': data.get('activityLog', [])
    }
    
    responses.append(response)
    
    # Enviar alerta por email (simulado)
    send_email_alert(
        quiz['creatorEmail'],
        session['user']['name'],
        session['user']['email'],
        quiz['title'],
        'Resposta enviada' + (' (atrasada)' if is_late else '')
    )
    
    return jsonify({'success': True, 'message': 'Respostas enviadas com sucesso!'})


@app.route('/quiz/<int:quiz_id>/toggle', methods=['POST'])
@require_login
def toggle_quiz(quiz_id):
    """Ativar/desativar questionário"""
    if session['user']['role'] != 'creator':
        return jsonify({'success': False, 'message': 'Acesso negado'})
    
    quiz = next((q for q in quizzes if q['id'] == quiz_id), None)
    if not quiz or quiz['creatorEmail'] != session['user']['email']:
        return jsonify({'success': False, 'message': 'Questionário não encontrado'})
    
    quiz['active'] = not quiz['active']
    
    return jsonify({'success': True, 'active': quiz['active']})


@app.route('/quiz/<int:quiz_id>/delete', methods=['POST'])
@require_login
def delete_quiz(quiz_id):
    """Excluir questionário"""
    if session['user']['role'] != 'creator':
        return jsonify({'success': False, 'message': 'Acesso negado'})
    
    global quizzes
    quiz = next((q for q in quizzes if q['id'] == quiz_id), None)
    if not quiz or quiz['creatorEmail'] != session['user']['email']:
        return jsonify({'success': False, 'message': 'Questionário não encontrado'})
    
    quizzes = [q for q in quizzes if q['id'] != quiz_id]
    
    return jsonify({'success': True, 'message': 'Questionário excluído'})


@app.route('/quiz/<int:quiz_id>/duplicate', methods=['POST'])
@require_login
def duplicate_quiz(quiz_id):
    """Duplicar questionário"""
    if session['user']['role'] != 'creator':
        return jsonify({'success': False, 'message': 'Acesso negado'})
    
    quiz = next((q for q in quizzes if q['id'] == quiz_id), None)
    if not quiz or quiz['creatorEmail'] != session['user']['email']:
        return jsonify({'success': False, 'message': 'Questionário não encontrado'})
    
    # Criar cópia
    access_code = generate_access_code()
    new_quiz = quiz.copy()
    new_quiz.update({
        'id': len(quizzes) + 1,
        'title': quiz['title'] + ' (Cópia)',
        'accessCode': access_code,
        'createdAt': datetime.now().isoformat()
    })
    
    quizzes.append(new_quiz)
    
    return jsonify({
        'success': True,
        'message': f'Questionário duplicado! Código: {access_code}',
        'accessCode': access_code
    })


@app.route('/quiz/<int:quiz_id>/export')
@require_login
def export_quiz_csv(quiz_id):
    """Exportar respostas para CSV"""
    if session['user']['role'] != 'creator':
        return "Acesso negado", 403
    
    quiz = next((q for q in quizzes if q['id'] == quiz_id), None)
    if not quiz or quiz['creatorEmail'] != session['user']['email']:
        return "Questionário não encontrado", 404
    
    quiz_responses = [r for r in responses if r['quizId'] == quiz_id]
    
    if not quiz_responses:
        return "Nenhuma resposta para exportar", 404
    
    # Criar CSV
    csv_lines = []
    
    # Cabeçalho
    header = ['Respondente', 'Email', 'Data', 'Atrasada']
    for i, q in enumerate(quiz['questions']):
        header.append(f'Pergunta {i+1}')
    header.append('Eventos')
    csv_lines.append(','.join([f'"{h}"' for h in header]))
    
    # Dados
    for resp in quiz_responses:
        row = [
            resp['respondentName'],
            resp['respondentEmail'],
            datetime.fromisoformat(resp['submittedAt']).strftime('%d/%m/%Y %H:%M'),
            'Sim' if resp.get('isLateSubmission') else 'Não'
        ]
        
        for i in range(len(quiz['questions'])):
            answer = resp['answers'].get(str(i), 'Não respondido')
            row.append(str(answer))
        
        row.append(str(len(resp.get('activityLog', []))))
        
        csv_lines.append(','.join([f'"{str(cell)}"' for cell in row]))
    
    csv_content = '\n'.join(csv_lines)
    
    from flask import Response
    return Response(
        csv_content,
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment;filename={quiz["title"].replace(" ", "_")}_respostas.csv'}
    )


@app.route('/logout')
def logout():
    """Logout"""
    session.clear()
    return redirect(url_for('home'))


@app.route('/api/quizzes')
def api_quizzes():
    """API: Listar questionários ativos"""
    active_quizzes = [
        {
            'id': q['id'],
            'title': q['title'],
            'description': q['description'],
            'accessCode': q['accessCode']
        }
        for q in quizzes if q['active']
    ]
    return jsonify(active_quizzes)


@app.route('/api/log-activity', methods=['POST'])
@require_login
def log_activity():
    """API: Registrar atividade suspeita"""
    if session['user']['role'] != 'respondent':
        return jsonify({'success': False})
    
    data = request.get_json()
    
    activity_logs.append({
        'userId': session['user']['email'],
        'quizId': session.get('active_quiz_id'),
        'action': data['action'],
        'timestamp': datetime.now().isoformat()
    })
    
    # Enviar alerta
    quiz = next((q for q in quizzes if q['id'] == session.get('active_quiz_id')), None)
    if quiz:
        send_email_alert(
            quiz['creatorEmail'],
            session['user']['name'],
            session['user']['email'],
            quiz['title'],
            data['action']
        )
    
    return jsonify({'success': True})


# ========== TEMPLATES HTML ==========

HOME_TEMPLATE = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Questionários</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div class="text-center mb-8">
            <svg class="w-20 h-20 text-indigo-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">Sistema de Questionários</h1>
            <p class="text-gray-600">Plataforma completa para criação e gerenciamento</p>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
            <a href="/register" class="bg-indigo-600 text-white p-8 rounded-xl hover:bg-indigo-700 transition text-center">
                <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                <h3 class="text-xl font-bold mb-2">Criador</h3>
                <p class="text-indigo-100 text-sm">Criar questionários</p>
            </a>
            <a href="/login/respondent" class="bg-green-600 text-white p-8 rounded-xl hover:bg-green-700 transition text-center">
                <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <h3 class="text-xl font-bold mb-2">Respondente</h3>
                <p class="text-green-100 text-sm">Responder questionários</p>
            </a>
        </div>
        <div class="mt-6 text-center">
            <p class="text-sm text-gray-600 mb-3">Já tem uma conta?</p>
            <div class="flex gap-3 justify-center">
                <a href="/login/creator" class="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Login Criador</a>
                <span class="text-gray-400">|</span>
                <a href="/login/respondent" class="text-green-600 hover:text-green-800 font-semibold text-sm">Login Respondente</a>
            </div>
        </div>
    </div>
</body>
</html>
'''

LOGIN_CREATOR_TEMPLATE = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Criador</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <a href="/" class="mb-6 text-indigo-600 hover:text-indigo-800 inline-block">← Voltar</a>
        <div class="text-center mb-8">
            <div class="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
            </div>
            <h1 class="text-3xl font-bold">Área do Criador</h1>
        </div>
        <form id="loginForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Email</label>
                <input type="email" id="email" required class="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Senha</label>
                <input type="password" id="password" required class="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-xs text-blue-900 font-semibold mb-2">Credenciais de teste:</p>
                <p class="text-xs text-blue-800">admin@quiz.com | 123456</p>
            </div>
            <button type="submit" class="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">
                Entrar
            </button>
            <div class="text-center pt-4 border-t">
                <a href="/register" class="text-indigo-600 hover:text-indigo-800 font-semibold">Criar Conta</a>
            </div>
        </form>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const response = await fetch('/login/creator', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value
                })
            });
            const data = await response.json();
            if (data.success) {
                window.location.href = '/dashboard';
            } else {
                alert(data.message);
            }
        });
    </script>
</body>
</html>
'''

REGISTER_TEMPLATE = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Criar Conta</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <a href="/login/creator" class="mb-6 text-purple-600 hover:text-purple-800 inline-block">← Voltar</a>
        <div class="text-center mb-8">
            <div class="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                </svg>
            </div>
            <h1 class="text-3xl font-bold">Criar Conta</h1>
        </div>
        <form id="registerForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Nome</label>
                <input type="text" id="name" required class="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Email</label>
                <input type="email" id="email" required class="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Senha (min 6)</label>
                <input type="password" id="password" required minlength="6" class="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Confirmar Senha</label>
                <input type="password" id="confirmPassword" required class="w-full px-4 py-3 border rounded-lg" />
            </div>
            <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                Criar Conta
            </button>
        </form>
    </div>
    <script>
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const response = await fetch('/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value,
                    confirmPassword: document.getElementById('confirmPassword').value
                })
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                window.location.href = '/login/creator';
            } else {
                alert(data.message);
            }
        });
    </script>
</body>
</html>
'''

LOGIN_RESPONDENT_TEMPLATE = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Respondente</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md max-h-screen overflow-y-auto">
        <a href="/" class="mb-6 text-green-600 hover:text-green-800 inline-block">← Voltar</a>
        <div class="text-center mb-8">
            <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
            </div>
            <h1 class="text-3xl font-bold">Respondente</h1>
        </div>
        {% if quizzes %}
        <div class="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <p class="text-sm font-bold text-blue-900 mb-3">Disponíveis:</p>
            <div class="space-y-2 max-h-60 overflow-y-auto">
                {% for quiz in quizzes %}
                <div class="bg-white p-3 rounded border flex justify-between items-center">
                    <div>
                        <p class="font-bold text-sm">{{ quiz.title }}</p>
                        <p class="text-xs text-gray-600">{{ quiz.description }}</p>
                    </div>
                    <div class="text-right ml-3">
                        <button onclick="document.getElementById('accessCode').value='{{ quiz.accessCode }}'" 
                                class="bg-blue-600 text-white px-3 py-1 rounded text-xs mb-1">Usar</button>
                        <p class="font-mono text-xs font-bold bg-blue-100 px-2 py-1 rounded">{{ quiz.accessCode }}</p>
                    </div>
                </div>
                {% endfor %}
            </div>
        </div>
        {% endif %}
        <form id="loginForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Nome</label>
                <input type="text" id="name" required class="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Email</label>
                <input type="email" id="email" required class="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Senha</label>
                <input type="password" id="password" required class="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Código</label>
                <input type="text" id="accessCode" required maxlength="6" 
                       class="w-full px-4 py-3 border rounded-lg uppercase font-mono text-lg" />
            </div>
            <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
                Acessar
            </button>
        </form>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const response = await fetch('/login/respondent', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value,
                    accessCode: document.getElementById('accessCode').value
                })
            });
            const data = await response.json();
            if (data.success) {
                window.location.href = '/quiz/' + data.quiz_id;
            } else {
                alert(data.message);
            }
        });
    </script>
</body>
</html>
'''

DASHBOARD_TEMPLATE = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <nav class="bg-white shadow-md p-4">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold text-indigo-600">Dashboard</h1>
            <div class="flex gap-4">
                <a href="/quiz/create" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                    + Novo Questionário
                </a>
                <a href="/logout" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                    Sair
                </a>
            </div>
        </div>
    </nav>
    
    <div class="max-w-7xl mx-auto p-6">
        <h2 class="text-2xl font-bold mb-6">Meus Questionários</h2>
        
        {% if quizzes %}
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {% for quiz in quizzes %}
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-bold">{{ quiz.title }}</h3>
                    <span class="px-2 py-1 text-xs rounded {{ 'bg-green-100 text-green-800' if quiz.active else 'bg-gray-100 text-gray-800' }}">
                        {{ 'Ativo' if quiz.active else 'Inativo' }}
                    </span>
                </div>
                <p class="text-sm text-gray-600 mb-4">{{ quiz.description }}</p>
                <div class="bg-gray-50 p-3 rounded mb-4">
                    <p class="text-xs text-gray-500 mb-1">Código de Acesso:</p>
                    <p class="font-mono font-bold text-lg">{{ quiz.accessCode }}</p>
                </div>
                <div class="flex gap-2">
                    <a href="/quiz/{{ quiz.id }}" class="flex-1 bg-indigo-600 text-white text-center py-2 rounded hover:bg-indigo-700 text-sm">
                        Ver Detalhes
                    </a>
                    <button onclick="toggleQuiz({{ quiz.id }})" class="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
                        {{ 'Desativar' if quiz.active else 'Ativar' }}
                    </button>
                </div>
            </div>
            {% endfor %}
        </div>
        {% else %}
        <div class="bg-white rounded-lg shadow-md p-12 text-center">
            <svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-xl font-bold text-gray-600 mb-2">Nenhum questionário criado</h3>
            <p class="text-gray-500 mb-6">Crie seu primeiro questionário para começar</p>
            <a href="/quiz/create" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                Criar Questionário
            </a>
        </div>
        {% endif %}
    </div>
    
    <script>
        async function toggleQuiz(quizId) {
            const response = await fetch(`/quiz/${quizId}/toggle`, { method: 'POST' });
            if (response.ok) {
                window.location.reload();
            }
        }
    </script>
</body>
</html>
'''

CREATE_QUIZ_TEMPLATE = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Criar Questionário</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <nav class="bg-white shadow-md p-4">
        <div class="max-w-4xl mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold text-indigo-600">Criar Questionário</h1>
            <a href="/dashboard" class="text-gray-600 hover:text-gray-800">← Voltar</a>
        </div>
    </nav>
    
    <div class="max-w-4xl mx-auto p-6">
        <div class="bg-white rounded-lg shadow-md p-8">
            <form id="createQuizForm" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium mb-2">Título*</label>
                    <input type="text" id="title" required class="w-full px-4 py-3 border rounded-lg" 
                           placeholder="Nome do questionário" />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Descrição</label>
                    <textarea id="description" rows="3" class="w-full px-4 py-3 border rounded-lg"
                              placeholder="Descrição opcional"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Data Limite (opcional)</label>
                    <input type="datetime-local" id="dueDate" class="w-full px-4 py-3 border rounded-lg" />
                </div>
                
                <div class="flex items-center gap-2">
                    <input type="checkbox" id="allowLateSubmissions" class="w-4 h-4" />
                    <label for="allowLateSubmissions" class="text-sm">Permitir envios após o prazo</label>
                </div>
                
                <div>
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold">Perguntas</h3>
                        <button type="button" onclick="addQuestion()" 
                                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                            + Adicionar Pergunta
                        </button>
                    </div>
                    
                    <div id="questionsContainer" class="space-y-4">
                        <!-- Perguntas serão adicionadas aqui -->
                    </div>
                </div>
                
                <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
                    Criar Questionário
                </button>
            </form>
        </div>
    </div>
    
    <script>
        let questions = [];
        
        function addQuestion() {
            const index = questions.length;
            questions.push({ question: '', type: 'text', options: [] });
            renderQuestions();
        }
        
        function removeQuestion(index) {
            questions.splice(index, 1);
            renderQuestions();
        }
        
        function renderQuestions() {
            const container = document.getElementById('questionsContainer');
            container.innerHTML = questions.map((q, index) => `
                <div class="border rounded-lg p-4">
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="font-semibold">Pergunta ${index + 1}</h4>
                        <button type="button" onclick="removeQuestion(${index})" 
                                class="text-red-600 hover:text-red-800">Remover</button>
                    </div>
                    <textarea id="question_${index}" rows="2" required
                              class="w-full px-3 py-2 border rounded mb-3"
                              placeholder="Digite a pergunta..."
                              onchange="questions[${index}].question = this.value">${q.question}</textarea>
                    <select id="type_${index}" class="w-full px-3 py-2 border rounded"
                            onchange="questions[${index}].type = this.value; renderQuestions()">
                        <option value="text" ${q.type === 'text' ? 'selected' : ''}>Texto</option>
                        <option value="multiple" ${q.type === 'multiple' ? 'selected' : ''}>Múltipla Escolha</option>
                    </select>
                    ${q.type === 'multiple' ? `
                        <div class="mt-3 space-y-2">
                            ${[0,1,2,3].map(i => `
                                <input type="text" placeholder="Opção ${i+1}"
                                       class="w-full px-3 py-2 border rounded"
                                       value="${q.options[i] || ''}"
                                       onchange="if(!questions[${index}].options) questions[${index}].options = []; questions[${index}].options[${i}] = this.value" />
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }
        
        // Adicionar primeira pergunta
        addQuestion();
        
        document.getElementById('createQuizForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                dueDate: document.getElementById('dueDate').value,
                allowLateSubmissions: document.getElementById('allowLateSubmissions').checked,
                questions: questions,
                active: true
            };
            
            const response = await fetch('/quiz/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            if (result.success) {
                alert(result.message);
                window.location.href = '/dashboard';
            } else {
                alert(result.message);
            }
        });
    </script>
</body>
</html>
'''

QUIZ_DETAILS_TEMPLATE = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ quiz.title }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <nav class="bg-white shadow-md p-4">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold text-indigo-600">{{ quiz.title }}</h1>
            <a href="/dashboard" class="text-gray-600 hover:text-gray-800">← Voltar</a>
        </div>
    </nav>
    
    <div class="max-w-7xl mx-auto p-6">
        <div class="grid md:grid-cols-3 gap-6 mb-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <p class="text-sm text-gray-600 mb-1">Total de Respostas</p>
                <p class="text-3xl font-bold text-indigo-600">{{ responses|length }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <p class="text-sm text-gray-600 mb-1">Código de Acesso</p>
                <p class="text-2xl font-mono font-bold">{{ quiz.accessCode }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <p class="text-sm text-gray-600 mb-1">Status</p>
                <p class="text-xl font-bold {{ 'text-green-600' if quiz.active else 'text-gray-600' }}">
                    {{ 'Ativo' if quiz.active else 'Inativo' }}
                </p>
            </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Ações</h2>
            </div>
            <div class="flex gap-4">
                <button onclick="toggleQuiz()" class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                    {{ 'Desativar' if quiz.active else 'Ativar' }}
                </button>
                <a href="/quiz/{{ quiz.id }}/export" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                    Exportar CSV
                </a>
                <button onclick="duplicateQuiz()" class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">
                    Duplicar
                </button>
                <button onclick="deleteQuiz()" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
                    Excluir
                </button>
            </div>
        </div>
        
        {% if responses %}
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold mb-4">Respostas Recebidas</h2>
            <div class="space-y-4">
                {% for resp in responses %}
                <div class="border rounded-lg p-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <p class="font-bold">{{ resp.respondentName }}</p>
                            <p class="text-sm text-gray-600">{{ resp.respondentEmail }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-600">{{ resp.submittedAt[:19] }}</p>
                            {% if resp.isLateSubmission %}
                            <span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Atrasada</span>
                            {% endif %}
                        </div>
                    </div>
                    <div class="space-y-2">
                        {% for i, question in enumerate(quiz.questions) %}
                        <div class="bg-gray-50 p-3 rounded">
                            <p class="text-sm font-medium mb-1">{{ question.question }}</p>
                            <p class="text-sm text-gray-700">{{ resp.answers.get(str(i), 'Não respondido') }}</p>
                        </div>
                        {% endfor %}
                    </div>
                    {% if resp.activityLog %}
                    <div class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p class="text-xs text-yellow-800">⚠️ {{ resp.activityLog|length }} evento(s) de atividade suspeita</p>
                    </div>
                    {% endif %}
                </div>
                {% endfor %}
            </div>
        </div>
        {% else %}
        <div class="bg-white rounded-lg shadow-md p-12 text-center">
            <p class="text-gray-500">Nenhuma resposta recebida ainda</p>
        </div>
        {% endif %}
    </div>
    
    <script>
        async function toggleQuiz() {
            const response = await fetch('/quiz/{{ quiz.id }}/toggle', { method: 'POST' });
            if (response.ok) {
                window.location.reload();
            }
        }
        
        async function duplicateQuiz() {
            const response = await fetch('/quiz/{{ quiz.id }}/duplicate', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                window.location.href = '/dashboard';
            }
        }
        
        async function deleteQuiz() {
            if (!confirm('Tem certeza que deseja excluir este questionário?')) return;
            const response = await fetch('/quiz/{{ quiz.id }}/delete', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                window.location.href = '/dashboard';
            }
        }
    </script>
</body>
</html>
'''

ANSWER_QUIZ_TEMPLATE = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ quiz.title }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div class="max-w-4xl mx-auto p-6">
        <div class="bg-white rounded-2xl shadow-xl p-8">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ quiz.title }}</h1>
                {% if quiz.description %}
                <p class="text-gray-600">{{ quiz.description }}</p>
                {% endif %}
                {% if quiz.dueDate %}
                <p class="text-sm text-orange-600 mt-2">Prazo: {{ quiz.dueDate[:16].replace('T', ' ') }}</p>
                {% endif %}
            </div>
            
            <form id="answerForm" class="space-y-6">
                {% for i, question in enumerate(quiz.questions) %}
                <div class="border rounded-lg p-6">
                    <label class="block font-semibold mb-3">{{ i + 1 }}. {{ question.question }}</label>
                    {% if question.type == 'text' %}
                    <textarea id="answer_{{ i }}" rows="4" 
                              class="w-full px-4 py-3 border rounded-lg"
                              placeholder="Sua resposta..."></textarea>
                    {% elif question.type == 'multiple' %}
                    <div class="space-y-2">
                        {% for j, option in enumerate(question.options) %}
                        {% if option %}
                        <label class="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="radio" name="answer_{{ i }}" value="{{ option }}" 
                                   class="w-4 h-4" />
                            <span>{{ option }}</span>
                        </label>
                        {% endif %}
                        {% endfor %}
                    </div>
                    {% endif %}
                </div>
                {% endfor %}
                
                <div class="flex gap-4">
                    <button type="submit" 
                            class="flex-1 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 text-lg">
                        Enviar Respostas
                    </button>
                    <a href="/logout" 
                       class="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancelar
                    </a>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        let activityLog = [];
        
        // Monitorar troca de aba
        document.addEventListener('visibilitychange', async () => {
            if (document.hidden) {
                activityLog.push({ timestamp: new Date().toISOString(), action: 'Saiu da aba' });
                await fetch('/api/log-activity', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ action: 'Saiu da aba' })
                });
            } else {
                activityLog.push({ timestamp: new Date().toISOString(), action: 'Retornou' });
            }
        });
        
        document.getElementById('answerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const answers = {};
            {% for i, question in enumerate(quiz.questions) %}
            {% if question.type == 'text' %}
            answers['{{ i }}'] = document.getElementById('answer_{{ i }}').value;
            {% elif question.type == 'multiple' %}
            const selected{{ i }} = document.querySelector('input[name="answer_{{ i }}"]:checked');
            answers['{{ i }}'] = selected{{ i }} ? selected{{ i }}.value : '';
            {% endif %}
            {% endfor %}
            
            // Verificar respostas vazias
            const unanswered = Object.values(answers).filter(a => !a.toString().trim()).length;
            if (unanswered > 0) {
                if (!confirm(unanswered + ' pergunta(s) sem resposta! Enviar mesmo assim?')) {
                    return;
                }
            }
            
            const response = await fetch('/quiz/{{ quiz.id }}/submit', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ answers, activityLog })
            });
            
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                window.location.href = '/logout';
            } else {
                alert(data.message);
            }
        });
    </script>
</body>
</html>
'''


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Sistema de Questionários - Python/Flask")
    print("=" * 60)
    print("\n📋 Funcionalidades:")
    print("  • Cadastro e login de usuários")
    print("  • Criação de questionários personalizados")
    print("  • Sistema de códigos de acesso")
    print("  • Monitoramento de atividade suspeita")
    print("  • Exportação para CSV")
    print("  • Duplicação de questionários")
    print("  • Controle de prazos")
    print("\n🔑 Credenciais de teste:")
    print("  Email: admin@quiz.com")
    print("  Senha: 123456")
    print("\n🌐 Acesse: http://localhost:5000")
    print("=" * 60)
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5000)

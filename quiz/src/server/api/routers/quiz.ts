import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const quizRouter = createTRPCRouter({
    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1),
                description: z.string().optional(),
                active: z.boolean().default(true),
                dueDate: z.date().optional(),
                allowLateSubmissions: z.boolean().default(false),
                questions: z.array(z.any()),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Generate a random 6 string alphanumeric code
            const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            return ctx.db.quiz.create({
                data: {
                    title: input.title,
                    description: input.description,
                    active: input.active,
                    dueDate: input.dueDate,
                    allowLateSubmissions: input.allowLateSubmissions,
                    accessCode,
                    creator: { connect: { id: ctx.session.user.id } },
                    questionsJson: JSON.stringify(input.questions),
                },
            });
        }),

    getAllByCreator: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.quiz.findMany({
            where: { creatorId: ctx.session.user.id },
            orderBy: { createdAt: "desc" },
        });
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const quiz = await ctx.db.quiz.findFirst({
                where: { id: input.id, creatorId: ctx.session.user.id },
                include: { responses: true }
            });
            if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
            return quiz;
        }),

    toggleActive: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const quiz = await ctx.db.quiz.findFirst({
                where: { id: input.id, creatorId: ctx.session.user.id },
            });
            if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });

            return ctx.db.quiz.update({
                where: { id: quiz.id },
                data: { active: !quiz.active },
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const quiz = await ctx.db.quiz.findFirst({
                where: { id: input.id, creatorId: ctx.session.user.id },
            });
            if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });

            return ctx.db.quiz.delete({
                where: { id: quiz.id }
            });
        }),

    getQuizByAccessCode: publicProcedure
        .input(z.object({ accessCode: z.string() }))
        .query(async ({ ctx, input }) => {
            const quiz = await ctx.db.quiz.findUnique({
                where: { accessCode: input.accessCode.toUpperCase() }
            });

            if (!quiz) throw new TRPCError({ code: "NOT_FOUND", message: "Código inválido" });
            if (!quiz.active) throw new TRPCError({ code: "FORBIDDEN", message: "Questionário encerrado" });

            return {
                ...quiz,
                questions: JSON.parse(quiz.questionsJson) as any[]
            };
        }),

    verifyAccessCode: publicProcedure
        .input(z.object({ accessCode: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const quiz = await ctx.db.quiz.findUnique({
                where: { accessCode: input.accessCode.toUpperCase() }
            });

            if (!quiz) throw new TRPCError({ code: "NOT_FOUND", message: "Código inválido" });
            if (!quiz.active) throw new TRPCError({ code: "FORBIDDEN", message: "Questionário encerrado" });

            if (quiz.dueDate && new Date() > quiz.dueDate && !quiz.allowLateSubmissions) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Prazo encerrado" });
            }

            return {
                ...quiz,
                questions: JSON.parse(quiz.questionsJson) as any[]
            };
        })
});

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const responseRouter = createTRPCRouter({
    submit: publicProcedure
        .input(
            z.object({
                quizId: z.string(),
                respondentName: z.string(),
                respondentEmail: z.string(),
                answers: z.any(),
                activityLog: z.array(z.any()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const quiz = await ctx.db.quiz.findUnique({
                where: { id: input.quizId }
            });

            if (!quiz) throw new TRPCError({ code: "NOT_FOUND", message: "Questionário não encontrado" });

            const isLate = quiz.dueDate ? new Date() > quiz.dueDate : false;

            return ctx.db.response.create({
                data: {
                    quizId: input.quizId,
                    respondentName: input.respondentName,
                    respondentEmail: input.respondentEmail,
                    answersJson: JSON.stringify(input.answers),
                    isLateSubmission: isLate,
                    activityLogJson: input.activityLog ? JSON.stringify(input.activityLog) : null
                }
            });
        })
});

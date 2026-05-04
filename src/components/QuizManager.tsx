"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import { Module, Quiz } from "@/domain/entities/module";

interface QuizManagerProps {
  modules: Module[];
  onQuizzesChange: (modules: Module[]) => void;
}

export function QuizManager({ modules, onQuizzesChange }: QuizManagerProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const panelClassName = "border-[#302D47] bg-[#181721] text-white";
  const inputClassName =
    "border-[#3B3754] bg-[#1F1D2B] text-white placeholder:text-white/50";

  const getModuleKey = (module: Module, index: number): string => {
    return module.id || module.tempId || `module-${index}`;
  };

  const getLessonKey = (
    lesson: { id?: string; tempId?: string },
    index: number,
  ): string => {
    return lesson.id || lesson.tempId || `lesson-${index}`;
  };

  const addQuestionToQuiz = (moduleKey: string, quizIndex: number) => {
    const updatedModules = modules.map((module) => {
      if (getModuleKey(module, modules.indexOf(module)) === moduleKey) {
        return {
          ...module,
          quizzes: module.quizzes?.map((quiz, index) =>
            index === quizIndex
              ? {
                  ...quiz,
                  questions: [
                    ...quiz.questions,
                    {
                      question: "",
                      questionType: "MULTIPLE_CHOICE" as const,
                      options: ["", "", "", ""],
                      correctAnswer: "",
                      points: 10,
                    },
                  ],
                }
              : quiz,
          ),
        };
      }
      return module;
    });
    onQuizzesChange(updatedModules);
  };

  const removeQuestion = (
    moduleKey: string,
    quizIndex: number,
    qIndex: number,
  ) => {
    const updatedModules = modules.map((module) => {
      if (getModuleKey(module, modules.indexOf(module)) === moduleKey) {
        return {
          ...module,
          quizzes: module.quizzes?.map((quiz, index) =>
            index === quizIndex
              ? {
                  ...quiz,
                  questions: quiz.questions.filter((_, idx) => idx !== qIndex),
                }
              : quiz,
          ),
        };
      }
      return module;
    });
    onQuizzesChange(updatedModules);
  };

  const updateQuestion = (
    moduleKey: string,
    quizIndex: number,
    qIndex: number,
    field: string,
    value: any,
  ) => {
    const updatedModules = modules.map((module) => {
      if (getModuleKey(module, modules.indexOf(module)) === moduleKey) {
        return {
          ...module,
          quizzes: module.quizzes?.map((quiz, index) =>
            index === quizIndex
              ? {
                  ...quiz,
                  questions: quiz.questions.map((question, idx) =>
                    idx === qIndex ? { ...question, [field]: value } : question,
                  ),
                }
              : quiz,
          ),
        };
      }
      return module;
    });
    onQuizzesChange(updatedModules);
  };

  const addQuizToModule = (moduleId: string) => {
    const updatedModules = modules.map((module) => {
      if (getModuleKey(module, modules.indexOf(module)) === moduleId) {
        const newQuiz: Quiz = {
          title: `Quiz pour ${module.title}`,
          description: "",
          passingScore: 70,
          questions: [
            {
              question: "",
              questionType: "MULTIPLE_CHOICE",
              options: ["", "", "", ""],
              correctAnswer: "",
              points: 10,
            },
          ],
        };
        return {
          ...module,
          quizzes: [...(module.quizzes || []), newQuiz],
        };
      }
      return module;
    });
    onQuizzesChange(updatedModules);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-white">Gestion des Quiz</h3>
        <p className="text-white/70">
          Créez des quiz d&apos;évaluation pour tester les connaissances des
          étudiants.
        </p>
      </div>

      {modules.map((module, moduleIndex) => (
        <Card
          key={getModuleKey(module, moduleIndex)}
          className={`w-full ${panelClassName}`}
        >
          <CardHeader className="border-b border-[#302D47]">
            <CardTitle className="flex items-center justify-between">
              <span>{module.title}</span>
              <Button
                onClick={() =>
                  addQuizToModule(getModuleKey(module, moduleIndex))
                }
                size="sm"
                variant="outline"
                className="border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#2B2740]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Quiz
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Lessons */}
            {module.lessons.map((lesson, lessonIndex) => (
              <div
                key={getLessonKey(lesson, lessonIndex)}
                className="mb-4 rounded-lg border border-[#302D47] bg-[#1F1D2B] p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{lesson.title}</h4>
                </div>
              </div>
            ))}

            {/* Quizzes */}
            {module.quizzes && module.quizzes.length > 0 && (
              <div className="mt-6 rounded-lg border border-[#3B3754] bg-[#1F1D2B] p-4">
                <h4 className="mb-4 font-medium text-white">
                  Quiz du module
                </h4>
                {module.quizzes.map((quiz, quizIndex) => (
                  <div key={quizIndex} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-white/85">
                        Titre du Quiz
                      </label>
                      <Input
                        value={quiz.title}
                        onChange={(e) => {
                          const updatedModules = modules.map((m) => {
                            if (
                              getModuleKey(m, modules.indexOf(m)) ===
                              getModuleKey(module, moduleIndex)
                            ) {
                              return {
                                ...m,
                                quizzes: m.quizzes?.map((q, idx) =>
                                  idx === quizIndex
                                    ? { ...q, title: e.target.value }
                                    : q,
                                ),
                              };
                            }
                            return m;
                          });
                          onQuizzesChange(updatedModules);
                        }}
                        placeholder="Titre du quiz"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-white">Questions</h5>
                        <Button
                          onClick={() =>
                            addQuestionToQuiz(
                              getModuleKey(module, moduleIndex),
                              quizIndex,
                            )
                          }
                          size="sm"
                          variant="outline"
                          className="border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#2B2740]"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter Question
                        </Button>
                      </div>

                      {quiz.questions.map((question, qIndex) => (
                        <Card key={qIndex} className={`mb-4 ${panelClassName}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">
                                Question {qIndex + 1}
                              </span>
                              <Button
                                onClick={() =>
                                  removeQuestion(
                                    getModuleKey(module, moduleIndex),
                                    quizIndex,
                                    qIndex,
                                  )
                                }
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <Textarea
                              value={question.question}
                              onChange={(e) =>
                                updateQuestion(
                                  getModuleKey(module, moduleIndex),
                                  quizIndex,
                                  qIndex,
                                  "question",
                                  e.target.value,
                                )
                              }
                              placeholder="Entrez la question"
                              className={`mb-2 ${inputClassName}`}
                            />

                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-white/85">
                                Options
                              </label>
                              {question.options.map((option, oIndex) => (
                                <Input
                                  key={oIndex}
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[oIndex] = e.target.value;
                                    updateQuestion(
                                      getModuleKey(module, moduleIndex),
                                      quizIndex,
                                      qIndex,
                                      "options",
                                      newOptions,
                                    );
                                  }}
                                  placeholder={`Option ${oIndex + 1}`}
                                  className={inputClassName}
                                />
                              ))}
                            </div>

                            <div className="mt-2">
                              <label className="mb-1 block text-sm font-medium text-white/85">
                                Réponse correcte
                              </label>
                              <select
                                value={question.correctAnswer}
                                onChange={(e) =>
                                  updateQuestion(
                                    getModuleKey(module, moduleIndex),
                                    quizIndex,
                                    qIndex,
                                    "correctAnswer",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded border border-[#3B3754] bg-[#1F1D2B] p-2 text-white"
                              >
                                <option value="">
                                  Sélectionnez la réponse correcte
                                </option>
                                {question.options.map((option, oIndex) => (
                                  <option key={oIndex} value={option}>
                                    {option || `Option ${oIndex + 1}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

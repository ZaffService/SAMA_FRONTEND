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

  const getModuleKey = (module: Module, index: number): string => {
    return module.id || module.tempId || `module-${index}`;
  };

  const getLessonKey = (lesson: { id?: string; tempId?: string }, index: number): string => {
    return lesson.id || lesson.tempId || `lesson-${index}`;
  };

  const addQuestionToQuiz = (moduleKey: string, lessonKey: string) => {
    const updatedModules = modules.map(module => {
      if (getModuleKey(module, modules.indexOf(module)) === moduleKey) {
        return {
          ...module,
          lessons: module.lessons.map(lesson => {
            if (getLessonKey(lesson, module.lessons.indexOf(lesson)) === lessonKey && lesson.quiz) {
              return {
                ...lesson,
                quiz: {
                  ...lesson.quiz,
                  questions: [
                    ...lesson.quiz.questions,
                    {
                      question: '',
                      questionType: 'MULTIPLE_CHOICE' as const,
                      options: ['', '', '', ''],
                      correctAnswer: '',
                      points: 10
                    }
                  ]
                }
              };
            }
            return lesson;
          })
        };
      }
      return module;
    });
    onQuizzesChange(updatedModules);
  };

  const removeQuestion = (moduleKey: string, lessonKey: string, qIndex: number) => {
    const updatedModules = modules.map(module => {
      if (getModuleKey(module, modules.indexOf(module)) === moduleKey) {
        return {
          ...module,
          lessons: module.lessons.map(lesson => {
            if (getLessonKey(lesson, module.lessons.indexOf(lesson)) === lessonKey && lesson.quiz) {
              return {
                ...lesson,
                quiz: {
                  ...lesson.quiz,
                  questions: lesson.quiz.questions.filter((_, index) => index !== qIndex)
                }
              };
            }
            return lesson;
          })
        };
      }
      return module;
    });
    onQuizzesChange(updatedModules);
  };

  const updateQuestion = (moduleKey: string, lessonKey: string, qIndex: number, field: string, value: any) => {
    const updatedModules = modules.map(module => {
      if (getModuleKey(module, modules.indexOf(module)) === moduleKey) {
        return {
          ...module,
          lessons: module.lessons.map(lesson => {
            if (getLessonKey(lesson, module.lessons.indexOf(lesson)) === lessonKey && lesson.quiz) {
              return {
                ...lesson,
                quiz: {
                  ...lesson.quiz,
                  questions: lesson.quiz.questions.map((question, index) =>
                    index === qIndex ? { ...question, [field]: value } : question
                  )
                }
              };
            }
            return lesson;
          })
        };
      }
      return module;
    });
    onQuizzesChange(updatedModules);
  };

  const addQuizToModule = (moduleId: string) => {
    const updatedModules = modules.map(module => {
      if (getModuleKey(module, modules.indexOf(module)) === moduleId) {
        const newQuiz: Quiz = {
          title: `Quiz pour ${module.title}`,
          description: '',
          passingScore: 70,
          questions: [
            {
              question: '',
              questionType: 'MULTIPLE_CHOICE',
              options: ['', '', '', ''],
              correctAnswer: '',
              points: 10
            }
          ]
        };
        return {
          ...module,
          quizzes: [...(module.quizzes || []), newQuiz]
        };
      }
      return module;
    });
    onQuizzesChange(updatedModules);
  };


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Gestion des Quiz</h3>
        <p className="text-gray-600">
          Créez des quiz d&apos;évaluation pour tester les connaissances des étudiants.
        </p>
      </div>

      {modules.map((module, moduleIndex) => (
        <Card key={getModuleKey(module, moduleIndex)} className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{module.title}</span>
              <Button
                onClick={() => addQuizToModule(getModuleKey(module, moduleIndex))}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Quiz
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {module.lessons.map((lesson, lessonIndex) => (
              <div key={getLessonKey(lesson, lessonIndex)} className="mb-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{lesson.title}</h4>
                  {!lesson.quiz && (
                    <Button
                      onClick={() => addQuizToModule(getModuleKey(module, moduleIndex))}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Quiz
                    </Button>
                  )}
                </div>

                {lesson.quiz && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Titre du Quiz
                      </label>
                      <Input
                        value={lesson.quiz.title}
                        onChange={(e) => {
                          const updatedModules = modules.map(m => {
                            if (getModuleKey(m, modules.indexOf(m)) === getModuleKey(module, moduleIndex)) {
                              return {
                                ...m,
                                lessons: m.lessons.map(l => {
                                  if (getLessonKey(l, m.lessons.indexOf(l)) === getLessonKey(lesson, lessonIndex)) {
                                    return {
                                      ...l,
                                      quiz: { ...l.quiz!, title: e.target.value }
                                    };
                                  }
                                  return l;
                                })
                              };
                            }
                            return m;
                          });
                          onQuizzesChange(updatedModules);
                        }}
                        placeholder="Titre du quiz"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Questions</h5>
                        <Button
                          onClick={() => addQuestionToQuiz(getModuleKey(module, moduleIndex), getLessonKey(lesson, lessonIndex))}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter Question
                        </Button>
                      </div>

                      {lesson.quiz.questions.map((question, qIndex) => (
                        <Card key={qIndex} className="mb-4">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Question {qIndex + 1}</span>
                              <Button
                                onClick={() => removeQuestion(getModuleKey(module, moduleIndex), getLessonKey(lesson, lessonIndex), qIndex)}
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <Textarea
                              value={question.question}
                              onChange={(e) => updateQuestion(getModuleKey(module, moduleIndex), getLessonKey(lesson, lessonIndex), qIndex, 'question', e.target.value)}
                              placeholder="Entrez la question"
                              className="mb-2"
                            />

                            <div className="space-y-2">
                              <label className="block text-sm font-medium">Options</label>
                              {question.options.map((option, oIndex) => (
                                <Input
                                  key={oIndex}
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[oIndex] = e.target.value;
                                    updateQuestion(getModuleKey(module, moduleIndex), getLessonKey(lesson, lessonIndex), qIndex, 'options', newOptions);
                                  }}
                                  placeholder={`Option ${oIndex + 1}`}
                                />
                              ))}
                            </div>

                            <div className="mt-2">
                              <label className="block text-sm font-medium mb-1">
                                Réponse correcte
                              </label>
                              <select
                                value={question.correctAnswer}
                                onChange={(e) => updateQuestion(getModuleKey(module, moduleIndex), getLessonKey(lesson, lessonIndex), qIndex, 'correctAnswer', e.target.value)}
                                className="w-full p-2 border rounded"
                              >
                                <option value="">Sélectionnez la réponse correcte</option>
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
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

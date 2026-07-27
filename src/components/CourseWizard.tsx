"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Save,
  Eye,
  AlertCircle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { StepIndicator, defaultCourseSteps } from "./StepIndicator";
import { ThumbnailUploader } from "./ThumbnailUploader";
import { QuizManager } from "./QuizManager";
import { CoursePreview } from "./CoursePreview";
import { AttachmentManager } from "./AttachmentManager";
import { VideoUploadManager } from "./VideoUploadManager";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { isYouTubeUrl } from "@/lib/youtube";
import {
  showCourseCreatedSuccess,
  showCourseCreationError,
  showDraftSavedSuccess,
  showLoadingToast,
  closeLoading,
} from "@/shared/helpers/sweet-alert";
import { Module } from "@/domain/entities/module";
import { useFileUpload } from "@/hooks/useFileUpload";
import { ModuleManager } from '@/components/ModuleManager';
import logger from "@/shared/helpers/logger";

// Course status enum
export enum CourseStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

interface Category {
  id: string;
  name: string;
}

interface CourseFormData {
  title: string;
  description: string;
  categoryId: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  price: string;
  status: CourseStatus;
  isCertifying: boolean;
  modules: Module[];
  attachments: Array<{ file: File; id: string; preview?: string }>;
  uploadedVideos: Record<string, string>; // tempId -> videoUrl
}

interface CourseWizardProps {
  onCourseCreated?: () => void;
}

const TOTAL_STEPS = 6;

export function CourseWizard({ onCourseCreated }: CourseWizardProps) {
  const router = useRouter();
  const { user } = useLocalAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const isCertifyingRef = useRef(false);

  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    categoryId: "",
    level: "BEGINNER",
    price: "",
    status: CourseStatus.DRAFT,
    isCertifying: false,
    modules: [],
    attachments: [],
    uploadedVideos: {},
  });

  useEffect(() => {
    isCertifyingRef.current = formData.isCertifying;
  }, [formData.isCertifying]);

  useEffect(() => {
    console.log(
      "[CourseWizard] State isCertifying:",
      formData.isCertifying,
      "currentStep:",
      currentStep,
    );
  }, [formData.isCertifying, currentStep]);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        logger.log("🔍 Wizard: Début du chargement des catégories...");
        const cats = await CoursesApi.getCategories();
        logger.log(`✅ Wizard: ${cats.length} catégories reçues`);
        setCategories(cats);
      } catch (err) {
        logger.error(
          "❌ Wizard: Erreur lors du chargement des catégories:",
          err,
        );
      }
    };
    loadCategories();
  }, []);

  const updateFormData = (updates: Partial<CourseFormData>) => {
    if (Object.prototype.hasOwnProperty.call(updates, "isCertifying")) {
      console.log(
        "[CourseWizard] updateFormData -> isCertifying:",
        updates.isCertifying,
      );
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleModulesChange = (modules: Module[]) => {
    updateFormData({ modules });
  };

  const handleAttachmentsChange = (
    attachments: Array<{ file: File; id: string; preview?: string }>,
  ) => {
    updateFormData({ attachments });
  };

  const handleThumbnailUploaded = (fileOrUrl: File | string) => {
    if (fileOrUrl instanceof File) {
      setThumbnailFile(fileOrUrl);
    } else {
      setThumbnailUrl(fileOrUrl);
    }
  };

  const handleThumbnailRemoved = () => {
    setThumbnailUrl(null);
    setThumbnailFile(null);
  };

  const handleVideoUploadSuccess = useCallback(
    (tempId: string, videoUrl: string) => {
      updateFormData({
        uploadedVideos: {
          ...formData.uploadedVideos,
          [tempId]: videoUrl,
        },
      });
    },
    [formData.uploadedVideos],
  );

  const handleVideoUploadError = useCallback(
    (tempId: string, error: string) => {
      logger.error(`Erreur d'upload pour la vidéo ${tempId}:`, error);
      // Ici, on pourrait ajouter une gestion d'erreur plus sophistiquée
    },
    [],
  );

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1: // Basic Info
        if (!formData.title.trim()) return "Le titre du cours est requis";
        if (!formData.description.trim())
          return "La description du cours est requise";
        if (!formData.categoryId) return "La catégorie est requise";
        if ((Number.parseInt(formData.price || "0", 10) || 0) < 0) {
          return "Le prix ne peut pas être négatif";
        }
        break;
      case 2: // Modules and Lessons
        if (formData.modules.length === 0)
          return "Au moins un module est requis";
        for (const module of formData.modules) {
          if (!module.title.trim()) {
            return `Le titre du module "${module.title || "sans titre"}" est requis`;
          }
          if (module.lessons.length === 0) {
            return `Le module "${module.title}" doit contenir au moins une leçon`;
          }
          for (const lesson of module.lessons) {
            if (!lesson.title.trim()) {
              return `Le titre de la leçon "${lesson.title || "sans titre"}" est requis`;
            }
            if (!lesson.content.trim()) {
              return `Le contenu de la leçon "${lesson.title}" est requis`;
            }
            if (!lesson.tempId) {
              return `La leçon "${lesson.title}" doit avoir un tempId`;
            }
            if (
              (lesson.videoSource === "youtube" ||
                (!lesson.videoFile && lesson.videoUrl)) &&
              lesson.videoUrl &&
              !isYouTubeUrl(lesson.videoUrl)
            ) {
              return `Lien YouTube invalide pour la leçon "${lesson.title}"`;
            }
          }
        }
        break;
      case 3: // Quiz (optional)
        for (const module of formData.modules) {
          if (module.quizzes && module.quizzes.length > 0) {
            for (const quiz of module.quizzes) {
              if (quiz.questions.length === 0) {
                return `Le quiz "${quiz.title}" du module "${module.title}" doit contenir au moins une question`;
              }
            }
          }
        }
        break;
      case 4: // Attachments (optional)
        break;
      case 5: // Preview
        // Cette validation est maintenant faite côté backend avec isComplete
        // Mais on garde une vérification côté frontend pour l'UX
        break;
    }
    return null;
  };

  const canProceedToStep = (step: number): boolean => {
    return validateStep(step) === null;
  };

  const handleNextStep = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      showCourseCreationError(validationError);
      return;
    }
    setError(null);
    if (currentStep < TOTAL_STEPS) {
      console.log(
        "[CourseWizard] Step next:",
        currentStep + 1,
        "isCertifying:",
        formData.isCertifying,
      );
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (currentStep > 1) {
      console.log(
        "[CourseWizard] Step back:",
        currentStep - 1,
        "isCertifying:",
        formData.isCertifying,
      );
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep || step === currentStep) {
      for (let s = 1; s < step; s++) {
        if (!canProceedToStep(s)) {
          setError(`Veuillez d'abord compléter l'étape ${s}`);
          return;
        }
      }
      setError(null);
      setCurrentStep(step);
    }
  };

  const prepareCourseData = (statusOverride?: CourseStatus) => {
    // Debug: Afficher les attachments avant envoi
    logger.log("📎 [Wizard] prepareCourseData - attachments:", formData.attachments);
    const resolvedIsCertifying =
      typeof formData.isCertifying === "boolean"
        ? formData.isCertifying
        : isCertifyingRef.current;
    console.log("[CourseWizard] prepareCourseData:", {
      isCertifying: resolvedIsCertifying,
      status: statusOverride || formData.status,
    });
    
    // instructorId sera null et récupéré par le backend depuis les cookies JWT
    return {
      ...formData,
      price: Number.parseInt(formData.price || "0", 10) || 0,
      isCertifying: resolvedIsCertifying,
      status: statusOverride || formData.status,
      instructorId: null, // Le backend extrait l'instructorId réel des cookies
      thumbnail: thumbnailFile || undefined,
      attachments: formData.attachments || [],
    };
  };

  const handlePostCreateRedirect = (
    createdIsCertifying: boolean,
    createdCourseId?: string | null,
  ) => {
    if (createdIsCertifying && createdCourseId) {
      router.push(`/admin/edit-course/${createdCourseId}?editor=certification`);
      return;
    }

    if (onCourseCreated) {
      onCourseCreated();
      return;
    }

    router.push("/admin-dashboard?courseCreated=true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateStep(2);
    if (validationError) {
      setError(validationError);
      showCourseCreationError(validationError);
      return;
    }

    setIsSubmitting(true);
    showLoadingToast("Création de votre cours en cours...");

    try {
      const result = await CoursesApi.createCourse(prepareCourseData());
      closeLoading();

      // ✅ IMPORTANT: Récupérer les détails du cours pour obtenir l'URL de la miniature mise à jour
      let updatedThumbnailUrl = result.course?.thumbnailUrl;
      const createdCourseId = result.courseId ?? result.course?.id;
      const createdIsCertifying = Boolean(
        formData.isCertifying ?? result.course?.isCertifying,
      );

      if (!updatedThumbnailUrl && result.courseId) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const details = await CoursesApi.getCourseDetails(result.courseId);
          updatedThumbnailUrl = details.course.thumbnailUrl;
          logger.log("✅ Miniature récupérée:", updatedThumbnailUrl);
        } catch (detailsErr) {
          logger.warn(
            "⚠️ Impossible de récupérer les détails du cours:",
            detailsErr,
          );
        }
      }

      // Vérifier si le cours est complet (toutes vidéos uploadées)
      const isComplete = result.course?.isComplete ?? true;

      if (isComplete) {
        // Cours entièrement prêt
        showCourseCreatedSuccess(formData.title, () => {
          handlePostCreateRedirect(createdIsCertifying, createdCourseId);
        });
      } else {
        // Cours créé mais vidéos en cours d'upload
        showCourseCreatedSuccess(
          `${formData.title} - Vidéos en cours d'upload`,
          () => {
            handlePostCreateRedirect(createdIsCertifying, createdCourseId);
          },
          "Le cours a été créé avec succès ! Les vidéos sont en cours d'upload en arrière-plan. Vous pourrez publier le cours une fois toutes les vidéos uploadées.",
        );
      }
    } catch (err) {
      closeLoading();
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du cours";
      setError(errorMessage);
      showCourseCreationError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      setError("Le titre du cours est requis pour sauvegarder un brouillon");
      showCourseCreationError("Le titre du cours est requis");
      return;
    }

    setIsSavingDraft(true);
    showLoadingToast("Sauvegarde du brouillon en cours...");

    try {
      // Utiliser la même logique que createCourse mais avec status: "DRAFT"
      const result = await CoursesApi.createCourse(
        prepareCourseData(CourseStatus.DRAFT),
      );
      closeLoading();
      const createdCourseId = result.courseId ?? result.course?.id;
      const createdIsCertifying = Boolean(
        formData.isCertifying ?? result.course?.isCertifying,
      );
      showDraftSavedSuccess(formData.title, () => {
        handlePostCreateRedirect(createdIsCertifying, createdCourseId);
      });
      logger.log("✅ Brouillon sauvegardé:", result);
    } catch (err) {
      closeLoading();
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la sauvegarde du brouillon";
      setError(errorMessage);
      showCourseCreationError(errorMessage);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleFinalAction = () => {
    if (formData.status === CourseStatus.DRAFT) {
      handleSaveDraft();
    } else {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  // Fonction pour obtenir la liste des vidéos à uploader
  const getVideosToUpload = useCallback(() => {
    const videos = [];
    for (const module of formData.modules) {
      for (const lesson of module.lessons) {
        if (lesson.videoFile && lesson.tempId) {
          videos.push({
            id: lesson.tempId,
            file: lesson.videoFile,
            lessonTitle: lesson.title,
            endpoint: `/api/upload/video`, // À adapter selon l'endpoint réel
          });
        }
      }
    }
    return videos;
  }, [formData.modules]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            formData={formData}
            updateFormData={updateFormData}
            categories={categories}
            thumbnailUrl={thumbnailUrl}
            onThumbnailUploaded={handleThumbnailUploaded}
            onThumbnailRemoved={handleThumbnailRemoved}
            canEditCertification={user?.role === "ADMIN"}
            showCertificationLockMessage={Boolean(
              user && user.role !== "ADMIN",
            )}
          />
        );
      case 2:
        return (
          <Step2ModulesAndLessons
            modules={formData.modules}
            onModulesChange={handleModulesChange}
          />
        );
      case 3:
        return (
          <Step3Quizzes
            modules={formData.modules}
            onQuizzesChange={handleModulesChange}
          />
        );
      case 4:
        return (
          <Step4Attachments
            attachments={formData.attachments}
            onAttachmentsChange={handleAttachmentsChange}
          />
        );
      case 5:
        return (
          <Step5VideoUploads
            videos={getVideosToUpload()}
            onVideoSuccess={handleVideoUploadSuccess}
            onVideoError={handleVideoUploadError}
          />
        );
      case 6:
        return (
          <CoursePreview
            courseData={formData}
            thumbnailUrl={thumbnailUrl || undefined}
            instructorName={
              user
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : "Instructeur"
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Créer un nouveau cours
        </h1>
        <p className="mt-2 text-white/70">
          Suivez les étapes ci-dessous pour créer votre cours.
        </p>
      </div>

      <StepIndicator
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        steps={defaultCourseSteps}
        onStepClick={handleStepClick}
      />

      {error && (
        <Alert className="mb-6 border border-[#EF4444] bg-[#35181D] text-white">
          <AlertCircle className="h-4 w-4 text-[#FCA5A5]" />
          <AlertDescription className="text-[#FECACA]">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6 border border-[#302D47] bg-[#1F1D2B]">
        <CardContent className="pt-6">{renderStep()}</CardContent>
      </Card>

      <div className="flex items-center justify-between border-t border-[#3B3754] pt-6">
        <div className="flex space-x-4">
          {currentStep > 1 && (
            <Button
              type="button"
              onClick={handlePrevStep}
              disabled={isSubmitting || isSavingDraft}
              className="bg-[#3B82F6] font-semibold text-white hover:bg-[#2563EB]"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
          )}

          {currentStep < TOTAL_STEPS ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isLoading}
              className="bg-[#3B82F6] font-semibold text-white hover:bg-[#2563EB]"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinalAction}
              disabled={isSubmitting || isSavingDraft}
              className="flex items-center space-x-2"
            >
              {isSubmitting || isSavingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : formData.status === CourseStatus.DRAFT ? (
                <Save className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span>
                {isSubmitting
                  ? "Création en cours..."
                  : isSavingDraft
                    ? "Sauvegarde..."
                    : formData.status === CourseStatus.DRAFT
                      ? "Sauvegarder le brouillon"
                      : "Publier le cours"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Basic Info
function Step1BasicInfo({
  formData,
  updateFormData,
  categories,
  thumbnailUrl,
  onThumbnailUploaded,
  onThumbnailRemoved,
  canEditCertification,
  showCertificationLockMessage,
}: {
  formData: CourseFormData;
  updateFormData: (updates: Partial<CourseFormData>) => void;
  categories: Category[];
  thumbnailUrl: string | null;
  onThumbnailUploaded: (fileOrUrl: File | string) => void;
  onThumbnailRemoved: () => void;
  canEditCertification: boolean;
  showCertificationLockMessage: boolean;
}) {
  const fieldClassName =
    "border-[#3B3754] bg-[#181721] text-white placeholder:text-white/55 font-semibold";
  const selectTriggerClassName =
    "border-[#3B3754] bg-[#181721] text-white font-semibold";
  const selectContentClassName = "border-[#3B3754] bg-[#1F1D2B] text-white";

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <ThumbnailUploader
          onThumbnailUploaded={onThumbnailUploaded}
          onThumbnailRemoved={onThumbnailRemoved}
          existingThumbnailUrl={thumbnailUrl || undefined}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="mb-2 block text-sm font-bold text-white">
            Titre du cours *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="Entrez le titre de votre cours"
            className={fieldClassName}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-white">
            Catégorie *
          </label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => updateFormData({ categoryId: value })}
          >
            <SelectTrigger className={selectTriggerClassName}>
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent className={selectContentClassName}>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="mb-2 block text-sm font-bold text-white">
            Niveau *
          </label>
          <Select
            value={formData.level}
            onValueChange={(value: "BEGINNER" | "INTERMEDIATE" | "ADVANCED") =>
              updateFormData({ level: value })
            }
          >
            <SelectTrigger className={selectTriggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={selectContentClassName}>
              <SelectItem value="BEGINNER">Débutant</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermédiaire</SelectItem>
              <SelectItem value="ADVANCED">Avancé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-white">
            Prix (XOF) *
          </label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.price}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              updateFormData({ price: digits });
            }}
            placeholder="0"
            className={fieldClassName}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-white">
            Statut du cours *
          </label>
          <Select
            value={formData.status}
            onValueChange={(value: CourseStatus) => {
              if (formData.isCertifying && value === CourseStatus.PUBLISHED) {
                updateFormData({ status: CourseStatus.DRAFT });
                return;
              }
              updateFormData({ status: value });
            }}
          >
            <SelectTrigger className={selectTriggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={selectContentClassName}>
              <SelectItem value={CourseStatus.DRAFT}>Brouillon</SelectItem>
              <SelectItem
                value={CourseStatus.PUBLISHED}
                disabled={formData.isCertifying}
              >
                {formData.isCertifying
                  ? "Publié (désactivé si certification)"
                  : "Publié"}
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs font-semibold text-white/80">
            Le cours sera créé en tant que brouillon par défaut
          </p>
          {formData.isCertifying && (
            <p className="text-xs text-blue-600 mt-1">
              Certification active : le statut est forcé à Brouillon.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[#3B3754] bg-[#181721] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E335F] text-[#80B5FF]">
              <BadgeCheck className="h-4 w-4" />
            </div>
            <div>
              <label
                htmlFor="course-certification"
                className="block text-sm font-semibold text-white"
              >
                Activer la certification
              </label>
              <p className="mt-1 text-xs text-white/75">
               Activez cette option pour rendre le cours certifiant. 
                Les étudiants recevront un certificat uniquement après 
                validation du quiz de certification défini dans le cours.
                            </p>
            </div>
          </div>
          <Switch
            id="course-certification"
            checked={formData.isCertifying}
            onCheckedChange={(checked) => {
              console.log(
                "[CourseWizard] Toggle certification:",
                checked ? "ON" : "OFF",
              );
              updateFormData({
                isCertifying: checked,
                status: checked ? CourseStatus.DRAFT : formData.status,
              });
            }}
            disabled={!canEditCertification}
          />
        </div>
        {showCertificationLockMessage && (
          <p className="mt-2 text-xs text-white/60">
            Vous n&apos;avez pas les droits pour activer la certification.
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-white">
          Description du cours *
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Décrivez votre cours en détail..."
          rows={6}
          className={fieldClassName}
          required
        />
      </div>
    </div>
  );
}

// Step 2: Modules and Lessons
function Step2ModulesAndLessons({
  modules,
  onModulesChange,
}: {
  modules: Module[];
  onModulesChange: (modules: Module[]) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-white/70">
        Organisez votre cours en modules et ajoutez des leçons avec du contenu
        et des vidéos.
      </p>
      <ModuleManager modules={modules} onModulesChange={onModulesChange} />
    </div>
  );
}

// Step 3: Quizzes
function Step3Quizzes({
  modules,
  onQuizzesChange,
}: {
  modules: Module[];
  onQuizzesChange: (modules: Module[]) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-white/70">
        Créez des quiz d&apos;évaluation pour tester les connaissances des
        étudiants.
      </p>
      <QuizManager modules={modules} onQuizzesChange={onQuizzesChange} />
    </div>
  );
}

// Step 4: Attachments
function Step4Attachments({
  attachments,
  onAttachmentsChange,
}: {
  attachments: Array<{ file: File; id: string; preview?: string }>;
  onAttachmentsChange: (
    attachments: Array<{ file: File; id: string; preview?: string }>,
  ) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-white/70">
        Ajoutez des ressources supplémentaires pour vos étudiants.
      </p>
      <AttachmentManager
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange}
      />
    </div>
  );
}

// Step 5: Video Uploads
function Step5VideoUploads({
  videos,
  onVideoSuccess,
  onVideoError,
}: {
  videos: Array<{
    id: string;
    file: File;
    lessonTitle: string;
    endpoint: string;
  }>;
  onVideoSuccess: (tempId: string, videoUrl: string) => void;
  onVideoError: (tempId: string, error: string) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-white/70">
        Uploadez les vidéos de vos leçons. Cette étape est nécessaire avant de
        publier votre cours.
      </p>
      <VideoUploadManager
        videos={videos}
        onVideoSuccess={onVideoSuccess}
        onVideoError={onVideoError}
        onRemoveVideo={(videoId) => {
          // Pour l'instant, on ne permet pas la suppression depuis cette étape
          // Cela pourrait être ajouté plus tard si nécessaire
        }}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
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
import {
  Loader2,
  Save,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { StepIndicator, defaultCourseSteps } from "./StepIndicator";
import { ModuleManager } from "./ModuleManager";
import { ThumbnailUploader } from "./ThumbnailUploader";
import { QuizManager } from "./QuizManager";
import { CoursePreview } from "./CoursePreview";
import { AttachmentManager } from "./AttachmentManager";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import {
  showCourseCreatedSuccess,
  showCourseCreationError,
  showDraftSavedSuccess,
  showLoadingToast,
  closeLoading,
} from "@/shared/helpers/sweet-alert";
import { Module } from "@/domain/entities/module";

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
  price: number;
  status: CourseStatus;
  modules: Module[];
  attachments: Array<{ file: File; id: string; preview?: string }>;
}

interface CourseWizardProps {
  onCourseCreated?: () => void;
}

const TOTAL_STEPS = 5;

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

  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    categoryId: "",
    level: "BEGINNER",
    price: 0,
    status: CourseStatus.DRAFT,
    modules: [],
    attachments: [],
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log("🔍 Wizard: Début du chargement des catégories...");
        const cats = await CoursesApi.getCategories();
        console.log(`✅ Wizard: ${cats.length} catégories reçues`);
        setCategories(cats);
      } catch (err) {
        console.error(
          "❌ Wizard: Erreur lors du chargement des catégories:",
          err,
        );
      }
    };
    loadCategories();
  }, []);

  const updateFormData = (updates: Partial<CourseFormData>) => {
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

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1: // Basic Info
        if (!formData.title.trim()) return "Le titre du cours est requis";
        if (!formData.description.trim())
          return "La description du cours est requise";
        if (!formData.categoryId) return "La catégorie est requise";
        if (formData.price < 0) return "Le prix ne peut pas être négatif";
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
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (currentStep > 1) {
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
    // instructorId sera null et récupéré par le backend depuis les cookies JWT
    return {
      ...formData,
      status: statusOverride || formData.status,
      instructorId: null, // Le backend extrait l'instructorId réel des cookies
      thumbnail: thumbnailFile || undefined,
      attachments: formData.attachments || [],
    };
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

      if (!updatedThumbnailUrl && result.courseId) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const details = await CoursesApi.getCourseDetails(result.courseId);
          updatedThumbnailUrl = details.course.thumbnailUrl;
          console.log("✅ Miniature récupérée:", updatedThumbnailUrl);
        } catch (detailsErr) {
          console.warn(
            "⚠️ Impossible de récupérer les détails du cours:",
            detailsErr,
          );
        }
      }

      showCourseCreatedSuccess(formData.title, () => {
        onCourseCreated?.();
        router.push("/admin-dashboard");
      });
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
      const result = await CoursesApi.createCourse(prepareCourseData(CourseStatus.DRAFT));
      closeLoading();
      showDraftSavedSuccess(formData.title);
      console.log("✅ Brouillon sauvegardé:", result);
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
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Créer un nouveau cours
        </h1>
        <p className="text-gray-600 mt-2">
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
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">{renderStep()}</CardContent>
      </Card>

      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex space-x-4">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={isSubmitting || isSavingDraft}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
          )}

          {currentStep < TOTAL_STEPS ? (
            <Button type="button" onClick={handleNextStep} disabled={isLoading}>
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
}: {
  formData: CourseFormData;
  updateFormData: (updates: Partial<CourseFormData>) => void;
  categories: Category[];
  thumbnailUrl: string | null;
  onThumbnailUploaded: (fileOrUrl: File | string) => void;
  onThumbnailRemoved: () => void;
}) {
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre du cours *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="Entrez le titre de votre cours"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie *
          </label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => updateFormData({ categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau *
          </label>
          <Select
            value={formData.level}
            onValueChange={(value: "BEGINNER" | "INTERMEDIATE" | "ADVANCED") =>
              updateFormData({ level: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEGINNER">Débutant</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermédiaire</SelectItem>
              <SelectItem value="ADVANCED">Avancé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix (XOF) *
          </label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) =>
              updateFormData({ price: parseFloat(e.target.value) || 0 })
            }
            placeholder="0"
            min="0"
            step="100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut du cours *
          </label>
          <Select
            value={formData.status}
            onValueChange={(value: CourseStatus) =>
              updateFormData({ status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CourseStatus.DRAFT}>Brouillon</SelectItem>
              <SelectItem value={CourseStatus.PUBLISHED}>Publié</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Le cours sera créé en tant que brouillon par défaut
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description du cours *
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Décrivez votre cours en détail..."
          rows={6}
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
      <p className="text-gray-600 mb-4">
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
      <p className="text-gray-600 mb-4">
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
      <p className="text-gray-600 mb-4">
        Ajoutez des ressources supplémentaires pour vos étudiants.
      </p>
      <AttachmentManager
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange}
      />
    </div>
  );
}


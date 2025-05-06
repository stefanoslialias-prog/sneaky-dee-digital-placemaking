
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuestionManager } from '@/hooks/useQuestionManager';
import QuestionDialog from '@/components/dashboard/questions/QuestionDialog';
import QuestionList from '@/components/dashboard/questions/QuestionList';

const QuestionDesigner: React.FC = () => {
  const {
    questions,
    loading,
    isDialogOpen,
    setIsDialogOpen,
    currentQuestion,
    setCurrentQuestion,
    isSaving,
    isDeleting,
    fetchQuestions,
    handleAddQuestion,
    handleEditQuestion,
    handleSaveQuestion,
    handleDeleteQuestion,
    handleMoveQuestion,
    toggleQuestionActive
  } = useQuestionManager();
  
  // Initial data fetch and real-time setup
  useEffect(() => {
    fetchQuestions();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public:survey_questions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'survey_questions' },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Survey Questions</CardTitle>
            <CardDescription>
              Design and manage the questions shown to community members
            </CardDescription>
          </div>
          <Button onClick={handleAddQuestion}>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </CardHeader>
        <CardContent>
          <QuestionList
            questions={questions}
            loading={loading}
            onAddQuestion={handleAddQuestion}
            onEditQuestion={handleEditQuestion}
            onMoveQuestion={handleMoveQuestion}
            onToggleActive={toggleQuestionActive}
          />
        </CardContent>
      </Card>
      
      {/* Question Editor Dialog */}
      <QuestionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentQuestion={currentQuestion}
        setCurrentQuestion={setCurrentQuestion}
        onSave={handleSaveQuestion}
        onDelete={handleDeleteQuestion}
        isSaving={isSaving}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default QuestionDesigner;

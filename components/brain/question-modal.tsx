import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { X, Send, CheckCircle, Brain, Lightbulb, Target, User, ChevronRight, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface QuestionData {
  id: string
  question: string
  category: string
  helperSuggestion?: string
}

interface QuestionModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  onComplete?: () => void
}

const categoryIcons = {
  business: Target,
  technical: Brain,
  personal: User,
  strategy: Lightbulb,
  marketing: ChevronRight,
  workflow: Settings,
  general: Brain
}

const categoryColors = {
  business: 'bg-blue-500',
  technical: 'bg-purple-500', 
  personal: 'bg-green-500',
  strategy: 'bg-yellow-500',
  marketing: 'bg-pink-500',
  workflow: 'bg-teal-500',
  general: 'bg-gray-500'
}

export function QuestionModal({ isOpen, onClose, workspaceId, onComplete }: QuestionModalProps) {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [knowledgeCount, setKnowledgeCount] = useState(0)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
  const questionsLeft = questions.length - currentQuestionIndex - 1

  // Load questions when  modal opens
  useEffect(() => {
    if (isOpen && questions.length === 0) {
      loadQuestions()
    }
  }, [isOpen])

  const loadQuestions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspace/${workspaceId}/brain/questions`)
      
      if (!response.ok) {
        throw new Error('Failed to load questions')
      }

      const data = await response.json()
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
        setKnowledgeCount(data.knowledgeCount || 0)
      } else {
        toast.error(data.message || 'No questions available. Add some knowledge first!')
        onClose()
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      toast.error('Failed to load questions')
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error('Please provide an answer')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/workspace/${workspaceId}/brain/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: currentAnswer,
          category: currentQuestion.category,
          questionId: currentQuestion.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save answer')
      }

      // Save answer to state
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: currentAnswer
      }))

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setCurrentAnswer('')
        toast.success('Answer saved! Next question...')
      } else {
        setIsCompleted(true)
        toast.success('All questions completed!')
      }

    } catch (error) {
      console.error('Error saving answer:', error)
      toast.error('Failed to save answer')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setCurrentAnswer('')
    } else {
      setIsCompleted(true)
    }
  }

  const handleComplete = () => {
    onComplete?.()
    onClose()
    
    // Reset state for next time
    setTimeout(() => {
      setQuestions([])
      setCurrentQuestionIndex(0)
      setAnswers({})
      setCurrentAnswer('')
      setIsCompleted(false)
    }, 300)
  }

  const handleClose = () => {
    onClose()
    
    // Reset state
    setTimeout(() => {
      setQuestions([])
      setCurrentQuestionIndex(0)
      setAnswers({})
      setCurrentAnswer('')
      setIsCompleted(false)
    }, 300)
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Brain className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Questions</h3>
            <p className="text-gray-600 text-center">
              AI is analyzing your knowledge base to generate 5 personalized questions that will make your helpers much smarter...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (isCompleted) {
    const answeredCount = Object.keys(answers).length
    
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Perfect! Your AI helpers are now much smarter.</h3>
            <p className="text-gray-600 text-center mb-8 max-w-md">
              You answered {answeredCount} questions and added valuable context to your knowledge base. Your helpers can now provide much more personalized and accurate assistance.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={handleComplete}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
              >
                Great, let's try it in chat
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleComplete}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to Brain AI
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!currentQuestion) {
    return null
  }

  const CategoryIcon = categoryIcons[currentQuestion.category as keyof typeof categoryIcons] || Brain
  const categoryColor = categoryColors[currentQuestion.category as keyof typeof categoryColors] || 'bg-gray-500'

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${categoryColor} rounded-xl flex items-center justify-center`}>
                <CategoryIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {questionsLeft > 0 ? `${questionsLeft + 1} left` : '1 left'}
                </DialogTitle>
                <p className="text-sm text-gray-500 capitalize">
                  {currentQuestion.category} • Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
          </div>
          
          <Progress value={progress} className="mt-4" />
        </DialogHeader>

        <div className="space-y-6">
          {/* Helper Suggestion */}
          {currentQuestion.helperSuggestion && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  AI Helper is eager to know...
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {currentQuestion.helperSuggestion}
                </p>
              </div>
            </div>
          )}

          {/* Question */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
              {currentQuestion.question}
            </h2>
            
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Answer here"
              className="min-h-[120px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              disabled={isSaving}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={handleSkipQuestion}
              disabled={isSaving}
              className="text-gray-600 hover:text-gray-800"
            >
              Skip Question
            </Button>
            
            <Button
              onClick={handleSaveAnswer}
              disabled={!currentAnswer.trim() || isSaving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Save
                  <Send className="h-4 w-4" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
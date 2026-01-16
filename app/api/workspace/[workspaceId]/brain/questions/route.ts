import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { openai } from '@/lib/openai'

interface QuestionData {
  id: string
  question: string
  category: string
  helperSuggestion?: string
}

// Generate questions based on knowledge base
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workspaceId } = params

    // Get recent knowledge documents
    const knowledgeDocs = await db.knowledgeDoc.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        content: true,
        sourceUrl: true,
        sourceType: true,
        metadata: true
      }
    })

    if (knowledgeDocs.length === 0) {
      return NextResponse.json({ 
        questions: [],
        message: "No knowledge base found. Add some content first to generate personalized questions."
      })
    }

    // Prepare knowledge summary for AI
    const knowledgeSummary = knowledgeDocs.map(doc => {
      const metadata = doc.metadata as any
      const isImage = metadata?.isImage === true
      const domain = doc.sourceUrl ? extractDomain(doc.sourceUrl) : 'document'
      
      return {
        type: isImage ? 'image' : doc.sourceType?.toLowerCase() || 'document',
        title: doc.title,
        domain,
        contentPreview: doc.content.substring(0, 500) + (doc.content.length > 500 ? '...' : '')
      }
    }).slice(0, 10) // Limit for AI context

    // Generate questions using AI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that generates personalized questions to help users expand their knowledge base.

Based on the user's existing knowledge, generate 3-5 thoughtful questions that would:
1. Help understand the user's specific use cases and goals
2. Gather missing context about their business/projects
3. Identify opportunities to improve their knowledge base
4. Be relevant to the content they've already added

Knowledge Summary:
${JSON.stringify(knowledgeSummary, null, 2)}

Generate exactly 5 questions in this JSON format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Specific, relevant question based on their knowledge?",
      "category": "business|technical|personal|strategy|marketing|workflow",
      "helperSuggestion": "Optional: which AI helper would be best for this topic"
    }
  ]
}

Question Guidelines:
- Generate EXACTLY 5 questions (no more, no less)
- Be highly specific to their content (mention actual domains, tools, or topics they've added)
- Ask about their goals, challenges, workflows, or decision-making processes
- Focus on actionable insights that will help AI assistants provide better recommendations
- Make questions conversational and engaging
- Vary the categories across all 5 questions (use different categories for each)
- Each question should unlock different aspects of their work/business

Question Types to Include:
1. Goal/Objective questions: "What are you trying to achieve with..."
2. Process/Workflow questions: "How do you currently handle..."  
3. Challenge/Problem questions: "What's the biggest challenge you face when..."
4. Context/Background questions: "Can you tell me more about your experience with..."
5. Decision/Strategy questions: "What factors do you consider when deciding..."
6. Audience/Customer questions: "Who is your target audience for..."
7. Tools/Technology questions: "What tools or technologies do you use for..."
8. Results/Metrics questions: "How do you measure success with..."`
        },
        {
          role: "user", 
          content: "Generate personalized questions based on my knowledge base."
        }
      ],
      response_format: { type: 'text' },
      temperature: 0.7,
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    let questions: QuestionData[] = []
    try {
      const parsed = JSON.parse(aiResponse)
      questions = parsed.questions || []
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback questions
      questions = generateFallbackQuestions(knowledgeDocs)
    }

    return NextResponse.json({ 
      questions,
      knowledgeCount: knowledgeDocs.length
    })

  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}

// Save question-answer pair as knowledge
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workspaceId } = params
    const { question, answer, category, questionId } = await request.json()

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      )
    }

    // Save as knowledge document
    const knowledgeDoc = await db.knowledgeDoc.create({
      data: {
        title: `Q&A: ${question.substring(0, 60)}${question.length > 60 ? '...' : ''}`,
        content: `Question: ${question}\n\nAnswer: ${answer}`,
        sourceType: 'MANUAL',
        workspaceId,
        metadata: {
          isQuestionAnswer: true,
          originalQuestion: question,
          category: category || 'general',
          questionId,
          createdVia: 'question_flow'
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      knowledgeDoc: {
        id: knowledgeDoc.id,
        title: knowledgeDoc.title
      }
    })

  } catch (error) {
    console.error('Error saving Q&A:', error)
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    )
  }
}

function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname.replace('www.', '')
  } catch {
    return url
  }
}

function generateFallbackQuestions(knowledgeDocs: any[]): QuestionData[] {
  const domainSet = new Set(knowledgeDocs
    .filter(doc => doc.sourceUrl)
    .map(doc => extractDomain(doc.sourceUrl))
  )
  const domains = Array.from(domainSet).slice(0, 3)
  
  // Pool of diverse fallback questions
  const questionPool: QuestionData[] = [
    {
      id: 'fallback-1',
      question: 'What are the main goals you want to achieve with the content you\'ve added to your knowledge base?',
      category: 'business',
      helperSuggestion: 'Marcus can help with business strategy'
    },
    {
      id: 'fallback-2',
      question: 'What specific challenges are you currently facing in your work or business that this knowledge should help solve?',
      category: 'strategy',
      helperSuggestion: 'Vizzy can provide insights and analysis'
    },
    {
      id: 'fallback-3',
      question: 'Who is your target audience or ideal customer, and what problems do you solve for them?',
      category: 'marketing',
      helperSuggestion: 'Zara can help with LinkedIn and social media strategy'
    },
    {
      id: 'fallback-4',
      question: 'What does your typical workflow look like from start to finish, and where do you see room for improvement?',
      category: 'workflow',
      helperSuggestion: 'Angelia can help optimize technical processes'
    },
    {
      id: 'fallback-5',
      question: 'What tools or technologies are you currently using, and how satisfied are you with their performance?',
      category: 'technical',
      helperSuggestion: 'Angelia can recommend better tools and integrations'
    },
    {
      id: 'fallback-6',
      question: 'What type of content or communications do you create most frequently, and what\'s your biggest struggle with it?',
      category: 'marketing',
      helperSuggestion: 'Emmie can help with email campaigns and content creation'
    },
    {
      id: 'fallback-7',
      question: 'How do you currently measure success in your projects, and what metrics matter most to you?',
      category: 'business',
      helperSuggestion: 'Marcus can help define better success metrics'
    },
    {
      id: 'fallback-8',
      question: 'What\'s the most time-consuming task in your daily routine that you wish you could automate or improve?',
      category: 'workflow',
      helperSuggestion: 'Vizzy can analyze your processes for optimization opportunities'
    },
    {
      id: 'fallback-9',
      question: 'What kind of questions do your customers or clients ask you most frequently?',
      category: 'business',
      helperSuggestion: 'Marcus can help develop better customer communication strategies'
    },
    {
      id: 'fallback-10',
      question: 'How do you stay updated with industry trends and what sources do you trust most?',
      category: 'personal',
      helperSuggestion: 'Vizzy can help curate and analyze industry information for you'
    },
    {
      id: 'fallback-11',
      question: 'What\'s your biggest pain point when it comes to organizing and managing your work or projects?',
      category: 'workflow',
      helperSuggestion: 'Angelia can suggest better project management tools and methods'
    },
    {
      id: 'fallback-12',
      question: 'What makes you different from your competitors, and how do you communicate that value?',
      category: 'marketing',
      helperSuggestion: 'Zara can help craft compelling value propositions for LinkedIn and social media'
    }
  ]

  // If we have domain-specific content, add targeted questions
  if (domains.length > 0) {
    const domain = domains[0]
    questionPool.push({
      id: 'fallback-domain',
      question: `How do you currently use ${domain} in your workflow, and what specific outcomes are you trying to achieve with it?`,
      category: 'technical',
      helperSuggestion: 'Angelia can help with technical integration and optimization'
    })
  }

  // Return exactly 5 random questions from the pool
  const shuffled = questionPool.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, 5)
}
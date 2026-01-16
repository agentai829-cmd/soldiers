import pdf from 'pdf-parse'

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('📄 Processing PDF:', file.name, 'Size:', file.size)

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use pdf-parse to extract text
    const data = await pdf(buffer)
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains only images. No text could be extracted.')
    }

    console.log('✅ PDF text extracted successfully:', data.text.length, 'characters')
    console.log('📊 PDF info:', {
      pages: data.numpages,
      info: data.info?.Title || 'No title',
      textLength: data.text.length
    })

    return data.text

  } catch (error) {
    console.error('❌ Error extracting text from PDF:', error)
    
    // More descriptive error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new Error('The uploaded file is not a valid PDF document.')
      } else if (error.message.includes('encrypted')) {
        throw new Error('This PDF is password-protected. Please upload an unencrypted PDF.')
      }
    }
    
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from DOCX file using mammoth
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    console.log('📝 Processing DOCX:', file.name)
    
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('DOCX file appears to be empty.')
    }

    console.log('✅ DOCX text extracted successfully:', result.value.length, 'characters')
    
    return result.value

  } catch (error) {
    console.error('❌ Error extracting text from DOCX:', error)
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from TXT or MD file
 */
export async function extractTextFromPlainText(file: File): Promise<string> {
  try {
    console.log('📝 Processing text file:', file.name)
    
    const text = await file.text()
    
    if (!text || text.trim().length === 0) {
      throw new Error('Text file appears to be empty.')
    }

    console.log('✅ Text extracted successfully:', text.length, 'characters')
    
    return text

  } catch (error) {
    console.error('❌ Error extracting text from file:', error)
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Main function to extract text from any supported file type
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  
  console.log('📁 Processing file:', {
    name: file.name,
    type: file.type,
    size: file.size,
    extension: fileExtension
  })

  try {
    // Handle different file types
    if (file.type === 'application/pdf' || fileExtension === 'pdf') {
      return await extractTextFromPDF(file)
    } 
    else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === 'docx') {
      return await extractTextFromDOCX(file)
    }
    else if (file.type === 'text/plain' || fileExtension === 'txt' || fileExtension === 'md' || file.type === 'text/markdown') {
      return await extractTextFromPlainText(file)
    }
    else {
      throw new Error(`Unsupported file type: ${file.type || fileExtension}. Supported types: PDF, DOCX, TXT, MD`)
    }
  } catch (error) {
    console.error('❌ File processing failed:', error)
    throw error
  }
}

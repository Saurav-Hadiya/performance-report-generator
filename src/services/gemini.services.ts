import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key
const getGeminiAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in the environment variables');
  }
  
  return new GoogleGenerativeAI(apiKey);
};

export interface PerformanceReport {
  ranking: number;
  improvements: string[];
  qualities: string[];
  summary: string;
}

/**
 * Generate a performance report for an employee based on review content
 * @param reviewContents Array of review contents
 * @param employeeName Name of the employee
 * @param employeeRole Role of the employee
 * @returns Promise with the performance report
 */
export const generatePerformanceReport = async (
  reviewContents: string[],
  employeeName: string,
  employeeRole: string
): Promise<PerformanceReport> => {
  try {
    const genAI = getGeminiAI();
    
    // For Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    You are an AI assistant tasked with analyzing performance feedback for ${employeeName}, who works as a ${employeeRole}.
    
    Please analyze the following feedback points from colleagues:
    ${reviewContents.map((content, i) => `${i + 1}. "${content}"`).join('\n')}
    
    The employee's performance is evaluated based on the following criteria and score each of them from 0 to 10 and add the list in the summary:
    1. Attitude
    2. Etiquette
    3. Communication Skills
    4. Creativity
    5. Adaptibility
    6. Technical skill
    7. Quality of Code/Design
    8. Productivity Levels
    9. Requirment Understanding Level
    10. Client Relation/Handling
    11. Indpendantly Task Success Ratio
    12. Multi Tasking Task Success Ratio
    13. No of Projects and Title
    14. Behaviour and Attitude
    15. Attendance & Punctuality
    16. Participation in Activity

    Based on the feedback, please generate a performance report with the following:
    1. A numerical ranking from 0-10 (with 10 being excellent)
    2. A list of areas for improvement
    3. A list of strengths/qualities
    4. A brief summary of overall performance
    
    Format your response as a valid JSON object with the following structure:
    {
      "ranking": number,
      "improvements": [string array],
      "qualities": [string array],
      "summary": string
    }
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }
    
    const jsonResponse = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (
      typeof jsonResponse.ranking !== 'number' || 
      !Array.isArray(jsonResponse.improvements) || 
      !Array.isArray(jsonResponse.qualities) || 
      typeof jsonResponse.summary !== 'string'
    ) {
      throw new Error('AI response does not match the expected format');
    }
    
    return {
      ranking: jsonResponse.ranking,
      improvements: jsonResponse.improvements,
      qualities: jsonResponse.qualities,
      summary: jsonResponse.summary
    };
  } catch (error) {
    console.error('Error generating performance report:', error);
    throw error;
  }
}; 
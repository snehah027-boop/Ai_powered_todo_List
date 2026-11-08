const analyzeDay = async (diaryContent, completedTasks, pendingTasks) => {
  const fastapiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
  
  try {
    const response = await fetch(`${fastapiUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        diary_content: diaryContent || '',
        completed_tasks: completedTasks.map(t => t.title),
        pending_tasks: pendingTasks.map(t => t.title),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FastAPI responded with status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI Service Communication Error:', error.message);
    throw new Error(`AI Analysis failed: ${error.message}`);
  }
};

module.exports = { analyzeDay };

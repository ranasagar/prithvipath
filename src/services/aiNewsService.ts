import { GoogleGenAI, Type } from "@google/genai";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { UNIQUE_DISTRICTS } from "@/src/constants/districts";

const apiKey = process.env.GEMINI_API_KEY;

export const generateAINews = async (category: string, categoryNepali: string) => {
  if (!apiKey) {
    throw new Error("Gemini API key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Use Nepali prompt matching the success pattern from seedData.ts for better results
  const prompt = `तपाईं एक पेशेवर नेपाली पत्रकार हुनुहुन्छ। "${categoryNepali}" (${category}) विधामा एउटा ताजा र महत्वपूर्ण समाचार सिर्जना गर्नुहोस्।
          
समाचारमा निम्न कुराहरू हुनुपर्छ:
१. आकर्षक र पेशेवर शीर्षक (Title) - सरल, स्पष्ट र ध्यानकर्षक
२. विस्तृत सारांश (Excerpt) - २-३ वाक्य, जसमा मुख्य विचार स्पष्ट होस्
३. विस्तृत र पेशेवर सामग्री (Full Content) - कम्तिमा ५-७ लामा अनुच्छेदहरू, जसमा:
   - समाचारको मुख्य विवरण र पृष्ठभूमि
   - ऐतिहासिक र सान्दर्भिक जानकारी
   - असर र परिणाम
   - भविष्यको दृष्टिकोण
   - औपचारिक र पेशेवर भाषा शैली
   - सम्पूर्ण HTML formatting (<p>, <h2>, <strong> आदि) को प्रयोग

४. इमेज कीवर्ड (imageKeyword) - एउटा मात्र नेपाली शब्द जुन चित्र खोज्न प्रयोग गर्न सकिन्छ
५. जिल्लाहरू (districts) - यो समाचार कुन जिल्लासँग सम्बन्धित छ? तलको सूचीबाट २-३ वटा जिल्लाहरू छान्नुहोस्

जिल्लाहरूको सूची: ${UNIQUE_DISTRICTS.join(", ")}

नतिजा एक JSON object को रूपमा दिनुहोस्।`;

  // Use proven model hierarchy - prefer free/low-tier models that work reliably
  // Note: Free tier has daily quota limits - if exceeded, use paid API key or wait 24 hours
  const modelsToTry = [
    "gemini-2.0-flash-exp",         // Experimental, often has better availability
    "gemini-2.0-flash",              // Newest free model
    "gemini-1.5-pro",                // Pro model (requires billing)
    "gemini-pro"                     // Legacy fallback
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              imageKeyword: { type: Type.STRING },
              districts: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              }
            },
            required: ["title", "excerpt", "content", "imageKeyword", "districts"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No content generated.");
      
      const data = JSON.parse(text);
      
      // Duplicate check: Check if an article with this title already exists
      const q = query(collection(db, "articles"), where("title", "==", data.title));
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        throw new Error("यो समाचार पहिले नै अवस्थित छ।");
      }

      // Fetch image from Wikimedia Commons using keyword (same as seedData.ts)
      let finalImageUrl = "";
      try {
        const keyword = data.imageKeyword || categoryNepali;
        const wikiRes = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(keyword)}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json&origin=*`);
        const wikiData = await wikiRes.json();
        if (wikiData.query && wikiData.query.pages) {
          const pages = wikiData.query.pages;
          const firstPageId = Object.keys(pages)[0];
          if (pages[firstPageId].imageinfo && pages[firstPageId].imageinfo.length > 0) {
            finalImageUrl = pages[firstPageId].imageinfo[0].url;
          }
        }
      } catch (err) {
        console.error("Failed to fetch image from Wikimedia:", err);
      }

      if (!finalImageUrl) {
        // Fallback to picsum if wikimedia fails
        const seed = encodeURIComponent(data.title.substring(0, 20));
        finalImageUrl = `https://picsum.photos/seed/${seed || category}/1200/800`;
      }
      
      return {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        imageUrl: finalImageUrl,
        districts: data.districts || [],
        sourceUrls: []
      };
    } catch (error) {
      console.error(`AI Generation Error with model ${model}:`, error);
      lastError = error;
      
      // Check for quota/rate limit errors
      const errorMessage = (error as any)?.message || '';
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
        // Don't retry if quota is exhausted - return specific error
        throw new Error("आप्नो दैनिक API कोटा समाप्त भयो। कृपया कल फेरि प्रयास गर्नुहोस् वा भारी API key प्रयोग गर्नुहोस्।");
      }
      
      // Continue to next model on other failures
    }
  }

  // All models failed
  throw lastError || new Error("सबै मडेलहरू असफल भयौ। कृपया सुनिश्चित गर्नुहोस् तपाईंको Gemini API key वैध छ र कोटा उपलब्ध छ।");
};

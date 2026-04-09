import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "./firebase";
import { GoogleGenAI, Type } from "@google/genai";
import { UNIQUE_DISTRICTS } from "../constants/districts";
import type { Article, Category } from "../types";

export const dummyCategories: Partial<Category>[] = [
  { nameNepali: "राजनीति", nameEnglish: "Politics", slug: "politics", order: 1 },
  { nameNepali: "देश", nameEnglish: "National", slug: "desh", order: 2 },
  { nameNepali: "प्रदेश", nameEnglish: "Province", slug: "pradesh", order: 3 },
  { nameNepali: "विश्व", nameEnglish: "International", slug: "bishwo", order: 4 },
  { nameNepali: "खेलकुद", nameEnglish: "Sports", slug: "sports", order: 5 },
  { nameNepali: "मनोरञ्जन", nameEnglish: "Entertainment", slug: "entertainment", order: 6 },
  { nameNepali: "अर्थ", nameEnglish: "Economy", slug: "economy", order: 7 },
  { nameNepali: "प्रविधि", nameEnglish: "Tech", slug: "tech", order: 8 },
];

export const seedDatabase = async (
  selectedCategories: string[], 
  onProgress?: (progress: number, message: string) => void
) => {
  try {
    console.log("Seeding started with Gemini AI...");
    onProgress?.(0, "सुरु गर्दै...");
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please check your environment variables.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const authorId = auth.currentUser?.uid;
    const authorName = auth.currentUser?.displayName || "Admin";
    
    if (!authorId) {
      throw new Error("User must be logged in to seed data.");
    }

    // 1. Seed Categories
    onProgress?.(5, "श्रेणीहरू जाँच गर्दै...");
    const categoriesCol = collection(db, "categories");
    const catSnapshot = await getDocs(categoriesCol);
    
    if (catSnapshot.empty) {
      onProgress?.(10, "श्रेणीहरू थप्दै...");
      for (const cat of dummyCategories) {
        await addDoc(categoriesCol, cat);
      }
      console.log("Categories seeded.");
    }

    // 2. Generate Articles using Gemini for selected categories
    const articlesCol = collection(db, "articles");
    const categoriesToSeed = dummyCategories.filter(c => selectedCategories.includes(c.slug!));
    const totalCategories = categoriesToSeed.length;
    
    for (let i = 0; i < totalCategories; i++) {
      const cat = categoriesToSeed[i];
      const progressBase = 15 + (i / totalCategories) * 80;
      
      onProgress?.(progressBase, `${cat.nameNepali} समाचारहरू सिर्जना गर्दै...`);
      console.log(`Generating articles for ${cat.nameEnglish}...`);
      
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `तपाईं एक पेशेवर नेपाली पत्रकार हुनुहुन्छ। "${cat.nameNepali}" (${cat.nameEnglish}) विधामा आजका ५ वटा ताजा र महत्वपूर्ण समाचारहरू सिर्जना गर्नुहोस्।
          
          प्रत्येक समाचारमा निम्न कुराहरू हुनुपर्छ:
          १. आकर्षक र पेशेवर शीर्षक (Title)
          २. छोटो सारांश (Excerpt) - २-३ वाक्य
          ३. विस्तृत सामग्री (Full Content) - कम्तिमा ४-५ लामा अनुच्छेदहरू, जसमा घटनाको विवरण, पृष्ठभूमि र सान्दर्भिक जानकारी समावेश होस्। भाषा शुद्ध, औपचारिक र पत्रकारिताको स्तरको हुनुपर्छ।
          ४. इमेज कीवर्ड (imageKeyword) - एउटा मात्र नेपाली शब्द जुन चित्र खोज्न प्रयोग गर्न सकिन्छ।
          ५. जिल्लाहरू (districts) - यो समाचार कुन जिल्लासँग सम्बन्धित छ? तलको सूचीबाट १-२ वटा जिल्लाहरू छान्नुहोस्।
          
          जिल्लाहरूको सूची: ${UNIQUE_DISTRICTS.join(", ")}
          
          नतिजा JSON array of objects को रूपमा दिनुहोस्।`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
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
          }
        });

        const text = response.text;
        if (!text) {
          console.warn(`No content returned for ${cat.nameEnglish}, skipping.`);
          continue;
        }

        const generatedArticles = JSON.parse(text);

        for (const art of generatedArticles) {
          // Duplicate check: Check if an article with this title already exists
          const q = query(articlesCol, where("title", "==", art.title));
          const existing = await getDocs(q);
          
          if (existing.empty) {
            // Fetch image
            let finalImageUrl = "";
            try {
              const keyword = art.imageKeyword || cat.nameNepali;
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
              const seed = encodeURIComponent(art.title.substring(0, 20));
              finalImageUrl = `https://picsum.photos/seed/${seed || cat.slug}/1200/800`;
            }

            await addDoc(articlesCol, {
              title: art.title,
              excerpt: art.excerpt,
              content: art.content,
              categoryId: cat.slug,
              authorId,
              authorName,
              status: "published",
              featuredImage: finalImageUrl,
              views: Math.floor(Math.random() * 5000),
              isBreaking: true, 
              isFeatured: Math.random() > 0.5,
              districts: art.districts || [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          } else {
            console.log(`Article with title "${art.title}" already exists, skipping.`);
          }
        }
      } catch (err) {
        const errorMsg = (err as any)?.message || '';
        if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
          console.error(`Quota exceeded for ${cat.nameEnglish}. Free tier daily limit reached. Please upgrade API key or try again tomorrow.`);
          onProgress?.(progressBase + 5, `${cat.nameNepali}: API कोटा समाप्त - कल फेरि प्रयास गर्नुहोस्`);
        } else {
          console.error(`Failed to seed ${cat.nameEnglish}:`, err);
          onProgress?.(progressBase + 5, `${cat.nameNepali}: त्रुटि भयो`);
        }
      }
    }

    onProgress?.(100, "सफलतापूर्वक सम्पन्न भयो!");
    console.log("Seeding completed successfully!");
    return { success: true };
  } catch (error) {
    const errorMsg = (error as any)?.message || '';
    console.error("Seeding failed:", error);
    
    // Provide specific error message for quota limits
    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      return { 
        success: false, 
        error: "आप्नो API कोटा समाप्त भयो। कृपया कल फेरि प्रयास गर्नुहोस् वा भारी API key प्रयोग गर्नुहोस्।" 
      };
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

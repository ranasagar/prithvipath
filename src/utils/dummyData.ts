import { collection, addDoc, writeBatch, doc, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";

const dummyCategories = [
  { nameNepali: "राजनीति", nameEnglish: "Politics", slug: "politics", order: 1 },
  { nameNepali: "देश", nameEnglish: "National", slug: "national", order: 2 },
  { nameNepali: "अर्थतन्त्र", nameEnglish: "Economy", slug: "economy", order: 3 },
  { nameNepali: "खेलकुद", nameEnglish: "Sports", slug: "sports", order: 4 },
  { nameNepali: "मनोरञ्जन", nameEnglish: "Entertainment", slug: "entertainment", order: 5 },
  { nameNepali: "जीवनशैली", nameEnglish: "Lifestyle", slug: "lifestyle", order: 6 },
  { nameNepali: "अन्तर्राष्ट्रिय", nameEnglish: "International", slug: "international", order: 7 },
  { nameNepali: "भिडियो", nameEnglish: "Video", slug: "video", order: 8 },
];

const dummyArticles = [
  {
    title: "नेपालको राजनीतिमा नयाँ मोड: सत्ता समीकरणमा फेरबदलको सम्भावना",
    excerpt: "काठमाडौंमा विकसित पछिल्लो राजनीतिक घटनाक्रमले सत्ता समीकरणमा नयाँ फेरबदल आउन सक्ने संकेत गरेको छ। प्रमुख दलहरूबीचको छलफल तीव्र बनेको छ।",
    content: "<p>काठमाडौंमा विकसित पछिल्लो राजनीतिक घटनाक्रमले सत्ता समीकरणमा नयाँ फेरबदल आउन सक्ने संकेत गरेको छ। प्रमुख दलहरूबीचको छलफल तीव्र बनेको छ।</p><p>विभिन्न राजनीतिक दलका नेताहरूबीच गोप्य भेटघाट र छलफलहरू भइरहेका छन्। यसले वर्तमान सरकारको भविष्य र नयाँ गठबन्धनको सम्भावनालाई लिएर अनेक अड्कलबाजीहरू सुरु भएका छन्।</p><p>राजनीतिक विश्लेषकहरूका अनुसार, यदि दलहरूबीच सहमति जुटेमा आगामी केही दिनभित्रै नयाँ राजनीतिक कोर्ष तय हुन सक्छ। जनताले भने स्थिरता र विकासको अपेक्षा गरिरहेका छन्।</p>",
    categoryId: "politics",
    status: "published",
    featuredImage: "https://picsum.photos/seed/politics1/1200/800",
    views: 1250,
    isBreaking: true,
    isFeatured: true,
    authorName: "प्रशासक",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: "नेपाली अर्थतन्त्रमा सुधारका संकेत: वैदेशिक मुद्रा सञ्चिति बढ्यो",
    excerpt: "नेपाल राष्ट्र बैंकको पछिल्लो प्रतिवेदन अनुसार नेपालको वैदेशिक मुद्रा सञ्चितिमा उल्लेख्य सुधार आएको छ। यसले अर्थतन्त्रमा सकारात्मक प्रभाव पार्ने विश्वास गरिएको छ।",
    content: "<p>नेपाल राष्ट्र बैंकको पछिल्लो प्रतिवेदन अनुसार नेपालको वैदेशिक मुद्रा सञ्चितिमा उल्लेख्य सुधार आएको छ। यसले अर्थतन्त्रमा सकारात्मक प्रभाव पार्ने विश्वास गरिएको छ।</p><p>रेमिट्यान्स आप्रवाहमा भएको वृद्धि र आयातमा आएको कमीका कारण सञ्चिति बढेको हो। यसले मुलुकको भुक्तानी सन्तुलनलाई पनि सकारात्मक बनाएको छ।</p><p>यद्यपि, आन्तरिक उत्पादन र लगानी बढाउन अझै धेरै काम गर्न बाँकी रहेको विज्ञहरू बताउँछन्। सरकारले उद्योग र कृषि क्षेत्रलाई प्राथमिकतामा राख्नुपर्ने सुझाव उनीहरूको छ।</p>",
    categoryId: "economy",
    status: "published",
    featuredImage: "https://picsum.photos/seed/economy1/1200/800",
    views: 850,
    isBreaking: false,
    isFeatured: true,
    authorName: "प्रशासक",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    title: "नेपाली क्रिकेट टोलीको ऐतिहासिक जित: विश्वकप छनोटमा स्थान पक्का",
    excerpt: "नेपाली राष्ट्रिय क्रिकेट टोलीले उत्कृष्ट प्रदर्शन गर्दै महत्वपूर्ण खेलमा जित हासिल गरेको छ। यससँगै नेपालले विश्वकप छनोटमा आफ्नो स्थान सुरक्षित गरेको छ।",
    content: "<p>नेपाली राष्ट्रिय क्रिकेट टोलीले उत्कृष्ट प्रदर्शन गर्दै महत्वपूर्ण खेलमा जित हासिल गरेको छ। यससँगै नेपालले विश्वकप छनोटमा आफ्नो स्थान सुरक्षित गरेको छ।</p><p>घरेलु मैदानमा भएको खेलमा नेपाली खेलाडीहरूले ब्याटिङ र बलिङ दुवै क्षेत्रमा उत्कृष्ट प्रदर्शन गरे। हजारौं दर्शकहरूको समर्थनले खेलाडीहरूको मनोबल उच्च बनाएको थियो।</p><p>यो जित नेपाली क्रिकेटको इतिहासमा एउटा महत्वपूर्ण कोशेढुङ्गा सावित भएको छ। अब नेपालले अन्तर्राष्ट्रिय स्तरमा अझ ठूला चुनौतीहरूको सामना गर्नुपर्नेछ।</p>",
    categoryId: "sports",
    status: "published",
    featuredImage: "https://picsum.photos/seed/sports1/1200/800",
    views: 3500,
    isBreaking: true,
    isFeatured: false,
    authorName: "प्रशासक",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  }
];

export const addDummyData = async (authorId: string) => {
  // Check if dummy data already exists
  const articlesSnapshot = await getDocs(collection(db, "articles"));
  if (!articlesSnapshot.empty) {
    // For now, let's just check if there are any articles. 
    // If there are, we might want to skip adding dummy data or add a check for specific titles.
    // Given the current implementation, let's just return if articles exist.
    return;
  }

  const batch = writeBatch(db);

  // Add categories
  for (const cat of dummyCategories) {
    const catRef = doc(collection(db, "categories"), cat.slug);
    batch.set(catRef, cat);
  }

  // Add articles
  for (const article of dummyArticles) {
    const articleRef = doc(collection(db, "articles"));
    batch.set(articleRef, {
      ...article,
      authorId: authorId
    });
  }

  // Add site settings if not exist
  const settingsRef = doc(db, "settings", "site");
  batch.set(settingsRef, {
    siteName: "पृथ्वी पथ मिडिया",
    siteDescription: "हामी सत्य, तथ्य र निष्पक्ष समाचार सम्प्रेषणका लागि प्रतिबद्ध छौं। समाजका हरेक पक्षलाई समेट्दै हामी तपाईंलाई सुसूचित गराउने प्रयासमा छौं।",
    logoUrl: "/logo.png",
    contactEmail: "info@prithvipath.com",
    contactPhone: "+९७७-१-४XXXXXX",
    address: "काठमाडौं, नेपाल",
    facebookUrl: "https://facebook.com",
    twitterUrl: "https://twitter.com",
    instagramUrl: "https://instagram.com",
    youtubeUrl: "https://youtube.com",
    footerText: "सर्वाधिकार सुरक्षित।"
  }, { merge: true });

  await batch.commit();
};

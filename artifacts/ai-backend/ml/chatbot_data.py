import re

DISCLAIMER = {
    "en": "This system provides general guidance and is not a medical diagnosis.",
    "hi": "यह प्रणाली सामान्य मार्गदर्शन प्रदान करती है और यह चिकित्सीय निदान नहीं है।",
    "od": "ଏହି ସିଷ୍ଟମ ସାଧାରଣ ଗାଇଡ଼ାନ୍ସ ଦିଏ ଏବଂ ଏହା ଚିକିତ୍ସା ନିଦାନ ନୁହେଁ।",
}

GREETINGS = {
    "en": ["hello", "hi", "hey", "good morning", "good evening", "good afternoon", "how are you", "what can you do", "help me"],
    "hi": ["नमस्ते", "नमस्कार", "हैलो", "हाय", "कैसे हो", "मदद", "सुप्रभात", "शुभ संध्या"],
    "od": ["ନମସ୍କାର", "ହ୍ୟାଲୋ", "ଶୁଭ ସକାଳ", "ଶୁଭ ସନ୍ଧ୍ୟା", "ମୋ ସାହାଯ୍ୟ"],
}

GREETING_RESPONSES = {
    "en": "Hello! I'm your MediTech health assistant. I can help you with symptoms, home care, finding doctors, and health guidance. How are you feeling today?",
    "hi": "नमस्ते! मैं आपका MediTech स्वास्थ्य सहायक हूँ। मैं आपके लक्षणों, घरेलू उपचार, डॉक्टर खोजने और स्वास्थ्य मार्गदर्शन में मदद कर सकता हूँ। आज आप कैसा महसूस कर रहे हैं?",
    "od": "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ MediTech ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ। ମୁଁ ଆପଣଙ୍କ ଲକ୍ଷଣ, ଘରୋଇ ଚିକିତ୍ସା ଓ ଡାକ୍ତର ଖୋଜିବାରେ ସାହାଯ୍ୟ କରିବି। ଆଜି ଆପଣ କେମିତି ଅଛନ୍ତି?",
}

SYMPTOM_KEYWORDS = {
    "fever": {
        "en": ["fever", "temperature", "hot body", "chills with fever", "body heat", "high temperature", "feeling hot"],
        "hi": ["बुखार", "ताप", "तेज बुखार", "गर्मी", "ठंड के साथ बुखार", "शरीर गर्म"],
        "od": ["ଜ୍ୱର", "ତାପମାତ୍ରା", "ଜ୍ୱରରେ", "ଶୀତ ସହ ଜ୍ୱର", "ଶରୀର ଗରମ"],
        "response": {
            "en": "You may have a fever. Rest well and drink plenty of water. Take paracetamol if needed. If fever stays above 103°F or lasts more than 3 days, please see a doctor.",
            "hi": "आपको बुखार हो सकता है। अच्छे से आराम करें और खूब पानी पिएं। जरूरत हो तो पैरासिटामोल लें। अगर बुखार 103°F से ऊपर हो या 3 दिन से ज्यादा रहे, तो डॉक्टर से मिलें।",
            "od": "ଆପଣଙ୍କୁ ଜ୍ୱର ହୋଇ ପାରେ। ଭଲ ଭାବରେ ଆରାମ କରନ୍ତୁ ଓ ପ୍ରଚୁର ପାଣି ପିଅନ୍ତୁ। ଯଦି ଜ୍ୱର 103°F ଉପରେ ଥାଏ ବା 3 ଦିନ ରହେ, ଡାକ୍ତରଙ୍କ ପାଖୁ ଯାଆନ୍ତୁ।",
        },
        "urgency": "low",
    },
    "cough": {
        "en": ["cough", "coughing", "sore throat", "throat pain", "cold and cough", "chest cough", "phlegm", "mucus"],
        "hi": ["खांसी", "गला दर्द", "सर्दी खांसी", "बलगम", "गले में दर्द", "कफ"],
        "od": ["କାଶ", "ଗଳା ଯନ୍ତ୍ରଣା", "ଥଣ୍ଡା ଓ କାଶ", "ଶ୍ଲେଷ୍ମ", "ଗଳାରେ ବ୍ୟଥା"],
        "response": {
            "en": "For cough and sore throat, drink warm water with honey and ginger. Rest your voice. Gargle with warm salt water. If cough persists more than 2 weeks or you see blood, see a doctor immediately.",
            "hi": "खांसी और गले में दर्द के लिए शहद और अदरक के साथ गर्म पानी पिएं। गर्म नमक के पानी से गरारे करें। अगर 2 हफ्ते से ज्यादा खांसी रहे या खून आए, तुरंत डॉक्टर से मिलें।",
            "od": "କାଶ ଓ ଗଳା ଯନ୍ତ୍ରଣା ପାଇଁ ମହୁ ଓ ଅଦା ସହ ଗରମ ପାଣି ପିଅନ୍ତୁ। ଗ୍ୟାଲଗ ଲୁଣ ପାଣି ଦ୍ୱାରା ଗରଗଡ଼ା କରନ୍ତୁ। ଯଦି 2 ସପ୍ତାହ ଅଧିକ ରହେ, ଡାକ୍ତରଙ୍କ ପାଖୁ ଯାଆନ୍ତୁ।",
        },
        "urgency": "low",
    },
    "headache": {
        "en": ["headache", "head pain", "migraine", "head ache", "pain in head", "heavy head", "head spinning"],
        "hi": ["सिर दर्द", "माइग्रेन", "सिर में दर्द", "सिर भारी", "सिर घूम", "सिर चक्कर"],
        "od": ["ମୁଣ୍ଡ ବ୍ୟଥା", "ମୁଣ୍ଡ ଯନ୍ତ୍ରଣା", "ମାଇଗ୍ରେନ", "ମୁଣ୍ଡ ଭାରୀ"],
        "response": {
            "en": "Rest in a quiet, dark room. Drink plenty of water. Apply a cool cloth on your forehead. Avoid bright screens. If headache is very sudden, very severe, or comes with fever/vision problems, go to a doctor immediately.",
            "hi": "शांत और अंधेरे कमरे में आराम करें। खूब पानी पिएं। माथे पर ठंडा कपड़ा रखें। अगर सिर दर्द बहुत अचानक और तेज हो, या बुखार/आंखों की समस्या हो, तो तुरंत डॉक्टर के पास जाएं।",
            "od": "ଶାନ୍ତ, ଅନ୍ଧାର ଘରେ ଆରାମ କରନ୍ତୁ। ପ୍ରଚୁର ପାଣି ପିଅନ୍ତୁ। ମୁଣ୍ଡରେ ଥଣ୍ଡା କପଡ଼ା ଲଗାନ୍ତୁ। ଯଦି ମୁଣ୍ଡ ବ୍ୟଥା ବହୁତ ତୀବ୍ର ଓ ହଠାତ୍ ହୁଏ, ଡାକ୍ତରଙ୍କ ପାଖୁ ଯାଆନ୍ତୁ।",
        },
        "urgency": "low",
    },
    "stomach_pain": {
        "en": ["stomach pain", "stomach ache", "belly pain", "abdominal pain", "stomach cramp", "gut pain", "navel pain"],
        "hi": ["पेट दर्द", "पेट में दर्द", "पेट की ऐंठन", "आंत में दर्द", "नाभि दर्द"],
        "od": ["ପେଟ ଯନ୍ତ୍ରଣା", "ପେଟ ଦରଜ", "ପେଟ ଦ୍ରଦ", "ଗ୍ୟାଷ୍ଟ୍ରିକ"],
        "response": {
            "en": "Rest and avoid spicy or heavy food. Drink warm water or ginger tea. Try light foods like rice, bananas, or toast. If pain is very severe, on the right side, or with vomiting/fever, see a doctor immediately.",
            "hi": "आराम करें और मसालेदार खाना न खाएं। गर्म पानी या अदरक की चाय पिएं। हल्का खाना खाएं। अगर दर्द बहुत तेज हो, दाहिनी तरफ हो, या उल्टी/बुखार हो तो तुरंत डॉक्टर के पास जाएं।",
            "od": "ଆରାମ କରନ୍ତୁ ଓ ଝାଲ ଖାଦ୍ୟ ଖାଆନ୍ତୁ ନାହିଁ। ଗରମ ପାଣି ବା ଅଦା ଚା ପିଅନ୍ତୁ। ଯଦି ଯନ୍ତ୍ରଣା ଅଧିକ ଓ ଡାହାଣ ପଟେ ହୁଏ, ଡାକ୍ତରଙ୍କ ପାଖୁ ଯାଆନ୍ତୁ।",
        },
        "urgency": "medium",
    },
    "vomiting": {
        "en": ["vomit", "vomiting", "nausea", "throwing up", "feeling sick", "puking", "want to vomit"],
        "hi": ["उल्टी", "जी मिचलाना", "मतली", "उल्टी होना", "वॉमिटिंग"],
        "od": ["ବାନ୍ତି", "ଶରୀର ଗୁଆ ଲାଗୁଛି", "ବାନ୍ତ ହେଉଛି", "ଅସୁସ୍ଥ ଲାଗୁଛି"],
        "response": {
            "en": "Take small sips of water or ORS. Eat light foods like crackers or bananas. Avoid dairy and heavy meals. If vomiting persists more than 24 hours or you see blood, go to a doctor.",
            "hi": "पानी या ORS के छोटे-छोटे घूंट लें। हल्का खाना खाएं। अगर 24 घंटे से ज्यादा उल्टी हो या खून दिखे, तो डॉक्टर के पास जाएं।",
            "od": "ପାଣି ବା ORS ଅଳ୍ପ ଅଳ୍ପ ପିଅନ୍ତୁ। ହାଲୁକା ଖାଦ୍ୟ ଖାଆନ୍ତୁ। ଯଦି 24 ଘଣ୍ଟା ଅଧିକ ବାନ୍ତ ହୁଏ ବା ରକ୍ତ ଦେଖିଲେ, ଡାକ୍ତରଙ୍କ ପାଖୁ ଯାଆନ୍ତୁ।",
        },
        "urgency": "medium",
    },
    "diarrhea": {
        "en": ["diarrhea", "loose motion", "loose stool", "running stomach", "watery stool", "loose bowel"],
        "hi": ["दस्त", "पतला पानी जैसा", "ढीला मल", "पेचिश", "डायरिया"],
        "od": ["ପাତଳା ଝଡ଼ା", "ଡାଇରିଆ", "ଝଡ଼ା", "ଆମ ଅଶ"],
        "response": {
            "en": "Stay hydrated with ORS, coconut water, or lemon water. Eat bananas, rice, boiled potatoes. Avoid milk and fatty foods. See a doctor if it lasts more than 2 days or if there is blood.",
            "hi": "ORS, नारियल पानी, नींबू पानी पिएं। केला, चावल, उबले आलू खाएं। दूध और तले खाने से बचें। अगर 2 दिन से ज्यादा हो या खून आए तो डॉक्टर के पास जाएं।",
            "od": "ORS, ନଡ଼ିଆ ପାଣି ପିଅନ୍ତୁ। କଦଳୀ, ଭାତ, ଉଚ୍ଚ ଆଳୁ ଖାଆନ୍ତୁ। ଯଦି 2 ଦିନ ଅଧିକ ଚାଲେ ବା ରକ୍ତ ଦେଖିଲେ, ଡାକ୍ତରଙ୍କ ପାଖୁ ଯାଆନ୍ତୁ।",
        },
        "urgency": "medium",
    },
    "chest_pain": {
        "en": ["chest pain", "chest ache", "heart pain", "left chest", "chest tightness", "chest pressure", "pain in chest"],
        "hi": ["सीने में दर्द", "छाती में दर्द", "दिल में दर्द", "सीना दर्द", "छाती भारी"],
        "od": ["ଛାତି ଯନ୍ତ୍ରଣା", "ଛାତି ଦ୍ରଦ", "ହୃଦୟ ଯନ୍ତ୍ରଣା", "ଛାତି ଭାରୀ"],
        "response": {
            "en": "⚠️ Chest pain can be serious. Sit down and rest immediately. If pain spreads to arm or jaw, or you feel breathless, call emergency services (108) right away. Do not ignore chest pain.",
            "hi": "⚠️ सीने का दर्द गंभीर हो सकता है। तुरंत बैठ जाएं और आराम करें। अगर दर्द हाथ या जबड़े तक फैले, या सांस लेने में तकलीफ हो, तो तुरंत 108 पर कॉल करें।",
            "od": "⚠️ ଛାତି ଯନ୍ତ୍ରଣା ଗୁରୁତ୍ୱପୂର୍ଣ ହୋଇ ପାରେ। ତୁରନ୍ତ ବସି ଆରାମ କରନ୍ତୁ। ଯଦି ଯନ୍ତ୍ରଣା ହାତ ବା ଜବାକୁ ଯାଏ, ତୁରନ୍ତ 108 ଡକ୍ ଦିଅନ୍ତୁ।",
        },
        "urgency": "high",
    },
    "breathing": {
        "en": ["breathing problem", "shortness of breath", "can't breathe", "difficulty breathing", "breathless", "asthma attack"],
        "hi": ["सांस लेने में तकलीफ", "सांस नहीं आ रही", "सांस फूल रही है", "दमा", "सांस की समस्या"],
        "od": ["ଶ୍ୱାସ ନେବାରେ ସମସ୍ୟା", "ଶ୍ୱାସ ଆସୁ ନାହିଁ", "ଦମ ଫୁଲୁଛି", "ଆଜ୍ମା"],
        "response": {
            "en": "⚠️ Difficulty breathing needs immediate attention. Sit upright and try to stay calm. Use your inhaler if you have one. Call 108 (ambulance) immediately. This is a medical emergency.",
            "hi": "⚠️ सांस लेने में तकलीफ पर तुरंत ध्यान देना जरूरी है। सीधे बैठें और शांत रहें। अगर inhaler है तो उसका उपयोग करें। तुरंत 108 पर कॉल करें।",
            "od": "⚠️ ଶ୍ୱାସ ସମସ୍ୟା ପ୍ରତି ତୁରନ୍ତ ଧ୍ୟାନ ଦେବା ଜରୁରୀ। ସିଧା ବସି ଶାନ୍ତ ରୁହନ୍ତୁ। ଇନ୍ହେଲର ଥଲେ ବ୍ୟବହାର କରନ୍ତୁ। ତୁରନ୍ତ 108 ଡକ୍ ଦିଅନ୍ତୁ।",
        },
        "urgency": "high",
    },
    "diabetes": {
        "en": ["diabetes", "sugar", "blood sugar", "sugar level", "diabetic", "insulin", "high sugar", "low sugar"],
        "hi": ["मधुमेह", "शुगर", "ब्लड शुगर", "डायबिटीज", "शुगर की बीमारी", "इंसुलिन"],
        "od": ["ମଧୁମେହ", "ଶୁଗର", "ଡାଇବେଟିସ", "ରକ୍ତ ଶର୍କରା"],
        "response": {
            "en": "For diabetes management: eat regular small meals, avoid sugary foods and white rice, exercise 30 minutes daily. Check blood sugar regularly. Take medicines as prescribed. See your doctor regularly.",
            "hi": "मधुमेह के लिए: नियमित छोटे भोजन खाएं, मीठा और सफेद चावल कम करें, रोज 30 मिनट व्यायाम करें। ब्लड शुगर नियमित चेक करें। दवाएं समय पर लें। डॉक्टर से नियमित मिलें।",
            "od": "ମଧୁମେହ ପାଇଁ: ନିୟମିତ ସ୍ୱଳ୍ପ ଖାଦ୍ୟ ଖାଆନ୍ତୁ, ମିଠା ଖାଦ୍ୟ ଓ ଧଳା ଚାଉଳ ଏଡ଼ାନ୍ତୁ, ଦୈନିକ 30 ମିନିଟ ବ୍ୟାୟାମ କରନ୍ତୁ। ରକ୍ତ ଶର୍କରା ନିୟମିତ ଯାଞ୍ଚ କରନ୍ତୁ।",
        },
        "urgency": "low",
    },
    "blood_pressure": {
        "en": ["blood pressure", "bp", "hypertension", "high bp", "low bp", "pressure", "bp high", "bp low"],
        "hi": ["रक्तचाप", "ब्लड प्रेशर", "बीपी", "हाई बीपी", "लो बीपी", "उच्च रक्तचाप"],
        "od": ["ରକ୍ତଚାପ", "ବ୍ଲଡ ପ୍ରେସର", "ହାଇ ବିପି", "ଲୋ ବିପି"],
        "response": {
            "en": "For blood pressure: reduce salt, eat fruits and vegetables, exercise regularly, avoid alcohol and smoking. Check BP at home regularly. If BP is very high (above 180/120), go to emergency immediately.",
            "hi": "रक्तचाप के लिए: नमक कम करें, फल और सब्जियां खाएं, नियमित व्यायाम करें। घर पर BP चेक करते रहें। अगर BP बहुत ज्यादा (180/120 से ऊपर) हो तो तुरंत डॉक्टर के पास जाएं।",
            "od": "ରକ୍ତଚାପ ପାଇଁ: ଲୁଣ କମ ଖାଆନ୍ତୁ, ଫଳ ଓ ପନ୍ଦ ଖାଆନ୍ତୁ, ନିୟମିତ ବ୍ୟାୟାମ କରନ୍ତୁ। ଯଦି BP ଅଧିକ (180/120 ଉପରେ) ହୁଏ, ତୁରନ୍ତ ଡାକ୍ତରଙ୍କ ପାଖୁ ଯାଆନ୍ତୁ।",
        },
        "urgency": "medium",
    },
    "weakness": {
        "en": ["weakness", "fatigue", "tiredness", "no energy", "feeling weak", "body ache", "lethargy", "exhausted"],
        "hi": ["कमज़ोरी", "थकान", "शरीर में दर्द", "ऊर्जा नहीं", "सुस्ती", "निढाल"],
        "od": ["ଦୁର୍ବଳତା", "ଥକ", "ଶରୀରରେ ଯନ୍ତ୍ରଣା", "ଶକ୍ତି ନାହିଁ"],
        "response": {
            "en": "Rest properly and eat a balanced diet with iron-rich foods like spinach, beans, and fruits. Drink plenty of water. Avoid caffeine. If weakness is severe or lasts more than a week, consult a doctor.",
            "hi": "अच्छे से आराम करें और पालक, फलियां, फल जैसे आयरन युक्त खाना खाएं। खूब पानी पिएं। अगर कमज़ोरी बहुत ज्यादा हो या 1 हफ्ते से ज्यादा रहे, डॉक्टर से मिलें।",
            "od": "ଭଲ ଆରାମ କରନ୍ତୁ ଓ ପାଳଙ୍ଗ, ଶିମ, ଫଳ ଭଳି ଲୌହ ସମୃଦ୍ଧ ଖାଦ୍ୟ ଖାଆନ୍ତୁ। ପ୍ରଚୁର ପାଣି ପିଅନ୍ତୁ। ଯଦି 1 ସପ୍ତାହ ଅଧିକ ରହେ, ଡାକ୍ତରଙ୍କ ପାଖୁ ଯାଆନ୍ତୁ।",
        },
        "urgency": "low",
    },
    "skin_issue": {
        "en": ["skin", "itching", "rash", "skin rash", "acne", "pimple", "wound", "cut", "burn", "infection", "fungal"],
        "hi": ["त्वचा", "खुजली", "दाने", "मुंहासे", "फंगल", "घाव", "जलन", "चोट", "खरोंच"],
        "od": ["ଚର୍ମ", "ଖଜ", "ଦାଗ", "ଘା", "ଜ୍ୱଳ", "ଫଙ୍ଗଲ"],
        "response": {
            "en": "Keep the skin area clean and dry. For wounds, clean gently with antiseptic. For rashes, avoid scratching and use calamine lotion. See a dermatologist if it worsens or spreads.",
            "hi": "त्वचा को साफ और सूखा रखें। घाव के लिए एंटीसेप्टिक से हल्के से साफ करें। दाने के लिए खुजलाएं नहीं और कैलामाइन लोशन लगाएं। अगर बढ़े या फैले तो त्वचा विशेषज्ञ के पास जाएं।",
            "od": "ଚର୍ମ ଅଞ୍ଚଳ ସଫା ଓ ଶୁଖିଲା ରଖନ୍ତୁ। ଘା ପାଇଁ ଆଣ୍ଟିସେପ୍ଟିକ ରେ ଧୀରେ ଧୀରେ ସଫା କରନ୍ତୁ। ଯଦି ଅଧିକ ହୁଏ, ଡାର୍ମାଟୋଲୋଜିଷ୍ଟଙ୍କ ପାଖୁ ଯାଆନ୍ତୁ।",
        },
        "urgency": "low",
    },
    "eye_problem": {
        "en": ["eye pain", "eye redness", "red eyes", "eye itching", "blurred vision", "watery eyes", "eye discharge"],
        "hi": ["आंख दर्द", "आंखें लाल", "आंख में खुजली", "धुंधला दिखना", "आंख से पानी"],
        "od": ["ଆଖି ଯନ୍ତ୍ରଣା", "ଆଖି ଲାଲ", "ଆଖିରେ ଖଜ", "ଅସ୍ପଷ୍ଟ ଦ୍ରଷ୍ଟ"],
        "response": {
            "en": "Rest your eyes and avoid screens. Clean with clean, lukewarm water. Wear sunglasses outdoors. If eye is very red, painful, or vision is suddenly blurred, see an eye doctor soon.",
            "hi": "आंखों को आराम दें और स्क्रीन से दूर रहें। साफ गुनगुने पानी से धोएं। बाहर जाते समय धूप का चश्मा पहनें। अगर आंख बहुत लाल, दर्दनाक हो या अचानक धुंधला दिखे, नेत्र विशेषज्ञ के पास जाएं।",
            "od": "ଆଖି ଆରାମ ଦିଅନ୍ତୁ ଓ ସ୍କ୍ରୀନ ଏଡ଼ାନ୍ତୁ। ଗ୍ୟାଥ ଅବ ଗୁଣ ଉଷ୍ମ ପାଣିରେ ଧୁଅନ୍ତୁ। ଯଦି ଆଖି ଅଧିକ ଲାଲ ବା ଅଦୃଶ୍ୟ ହୁଏ, ଆଖି ଡାକ୍ତରଙ୍କ ପାଖୁ ଯାଆନ୍ତୁ।",
        },
        "urgency": "low",
    },
    "emergency": {
        "en": ["emergency", "help", "serious", "critical", "unconscious", "fainted", "not waking up", "accident", "ambulance", "stroke"],
        "hi": ["आपातकाल", "मदद करो", "गंभीर", "बेहोश", "एम्बुलेंस", "स्ट्रोक", "दुर्घटना"],
        "od": ["ଜରୁରୀ", "ସାହାଯ୍ୟ ଦେ", "ଗୁରୁତ୍ୱ", "ଏମ୍ବୁଲ୍ୟାନ୍ସ", "ବେହୋସ"],
        "response": {
            "en": "🚨 EMERGENCY! Call 108 for ambulance immediately. Keep the patient calm and still. Do not give food or water. Stay on the line with emergency services. Help is on the way.",
            "hi": "🚨 आपातकाल! तुरंत 108 पर एम्बुलेंस के लिए कॉल करें। मरीज को शांत और स्थिर रखें। खाना या पानी न दें। आपातकालीन सेवाओं के साथ लाइन पर बने रहें। मदद आ रही है।",
            "od": "🚨 ଜରୁରୀ! ତୁରନ୍ତ 108 ରେ ଏମ୍ବୁଲ୍ୟାନ୍ସ ଡ଼ାକନ୍ତୁ। ରୋଗୀଙ୍କୁ ଶାନ୍ତ ଓ ସ୍ଥିର ରଖନ୍ତୁ। ଖାଦ୍ୟ ବା ପାଣି ଦିଅନ୍ତୁ ନାହିଁ। ସାହାଯ୍ୟ ଆସୁଛି।",
        },
        "urgency": "high",
    },
    "doctor_appointment": {
        "en": ["doctor", "appointment", "book appointment", "see a doctor", "hospital", "consult", "specialist", "meet doctor"],
        "hi": ["डॉक्टर", "अपॉइंटमेंट", "डॉक्टर से मिलना", "अस्पताल", "परामर्श"],
        "od": ["ଡାକ୍ତର", "ଅ୍ୟାପଏଣ୍ଟ ମ୍ୟାଟ", "ଡାକ୍ତରଙ୍କ ସହ ଦେଖା"],
        "response": {
            "en": "I can help you find a doctor. You can visit the Hospitals section in this app to find nearby hospitals and available doctors. You can also use Book Ambulance for urgent care. Would you like me to guide you there?",
            "hi": "मैं आपको डॉक्टर खोजने में मदद कर सकता हूँ। इस app में Hospitals सेक्शन में जाएं और पास के अस्पताल और डॉक्टर खोजें। क्या मैं आपको वहां ले जाऊं?",
            "od": "ମୁଁ ଆପଣଙ୍କୁ ଡାକ୍ତର ଖୋଜିବାରେ ସାହାଯ୍ୟ କରିପାରିବି। ଏହି app ରେ Hospitals ବିଭାଗ ଦେଖନ୍ତୁ। ଆପଣ ଏଠୁ ଯିବାକୁ ଚାଆ ଆ?",
        },
        "urgency": "low",
    },
    "medicine": {
        "en": ["medicine", "tablet", "capsule", "drug", "medication", "pill", "dose", "dosage", "prescription"],
        "hi": ["दवाई", "टैबलेट", "कैप्सूल", "दवा", "गोली", "खुराक", "नुस्खा"],
        "od": ["ଔଷଧ", "ଟ୍ୟାବ୍ଲେଟ", "ଦବା", "ଡୋଜ", "ଗୋଲି"],
        "response": {
            "en": "I can help scan a prescription. Please upload a photo of your prescription in the Prescription Scanner section. I can identify medicine names from the image. Always follow your doctor's instructions for dosage.",
            "hi": "मैं prescription scan करने में मदद कर सकता हूँ। Prescription Scanner में अपनी prescription की फोटो अपलोड करें। खुराक के लिए हमेशा डॉक्टर के निर्देश मानें।",
            "od": "ମୁଁ Prescription Scanner ରୁ ଔଷଧ ଚିହ୍ନଟ ସାହାଯ୍ୟ କରିପାରିବି। ଔଷଧ ଡୋଜ ପାଇଁ ସର୍ବଦା ଡାକ୍ତରଙ୍କ ନିର୍ଦ୍ଦେଶ ଅନୁସରଣ କରନ୍ତୁ।",
        },
        "urgency": "low",
    },
}

DEFAULT_RESPONSES = {
    "en": "I understand you may have a health concern. Could you tell me more about your symptoms? For example: fever, headache, cough, stomach pain, or any other discomfort? I'm here to help.",
    "hi": "मुझे लगता है आपको कोई स्वास्थ्य समस्या है। क्या आप अपने लक्षण बता सकते हैं? जैसे: बुखार, सिर दर्द, खांसी, पेट दर्द? मैं यहाँ मदद के लिए हूँ।",
    "od": "ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ସମ୍ପର୍କୀୟ ସମସ୍ୟା ଥୁ ପାରେ। ଆପଣ ଲକ୍ଷଣ ବିଷୟରେ ଅଧିକ ଜଣାଇ ପାରିବେ? ଯଥା: ଜ୍ୱର, ମୁଣ୍ଡ ବ୍ୟଥା, କାଶ। ଆମି ଆପଣଙ୍କ ସାହାଯ୍ୟ ପାଇଁ ଆଛି।",
}

TRANSLATIONS = {
    "fever": {"en": "Fever", "hi": "बुखार", "od": "ଜ୍ୱର"},
    "cough": {"en": "Cough", "hi": "खांसी", "od": "କାଶ"},
    "headache": {"en": "Headache", "hi": "सिर दर्द", "od": "ମୁଣ୍ଡ ବ୍ୟଥା"},
    "stomach_pain": {"en": "Stomach Pain", "hi": "पेट दर्द", "od": "ପେଟ ଯନ୍ତ୍ରଣା"},
    "chest_pain": {"en": "Chest Pain", "hi": "सीने में दर्द", "od": "ଛାତି ଯନ୍ତ୍ରଣା"},
    "diabetes": {"en": "Diabetes", "hi": "मधुमेह", "od": "ମଧୁମେହ"},
    "doctor": {"en": "Doctor", "hi": "डॉक्टर", "od": "ଡାକ୍ତର"},
    "hospital": {"en": "Hospital", "hi": "अस्पताल", "od": "ଡାକ୍ତରଖାନା"},
    "emergency": {"en": "Emergency", "hi": "आपातकाल", "od": "ଜରୁରୀ"},
    "medicine": {"en": "Medicine", "hi": "दवाई", "od": "ଔଷଧ"},
}


def detect_language(text: str) -> str:
    devanagari = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    odia = sum(1 for c in text if '\u0B00' <= c <= '\u0B7F')
    if odia > 0 and odia >= devanagari:
        return "od"
    if devanagari > 0:
        return "hi"
    text_lower = text.lower()
    hindi_roman = ["mujhe", "mera", "meri", "hain", "hai", "bukhar", "dard", "khansi", "sar", "pet",
                   "seena", "ulti", "kamzori", "dawai", "dawa", "doctor", "madad", "bimari", "takleef", "ache"]
    odia_roman = ["mora", "mote", "ame", "jwar", "kash", "mathare", "peta", "chati", "banti", "daktar"]
    hi_count = sum(1 for w in hindi_roman if w in text_lower)
    od_count = sum(1 for w in odia_roman if w in text_lower)
    if od_count > hi_count:
        return "od"
    if hi_count > 0:
        return "hi"
    return "en"


def match_intent(text: str) -> tuple:
    text_lower = text.lower()
    for greeting in (GREETINGS["en"] + GREETINGS["hi"] + GREETINGS["od"]):
        if greeting.lower() in text_lower:
            return "greeting", None

    best_match = None
    best_score = 0
    for symptom_key, data in SYMPTOM_KEYWORDS.items():
        score = 0
        for lang in ["en", "hi", "od"]:
            for kw in data.get(lang, []):
                if kw.lower() in text_lower:
                    score += 1
        if score > best_score:
            best_score = score
            best_match = symptom_key

    if best_match and best_score > 0:
        return "symptom", best_match
    return "unknown", None

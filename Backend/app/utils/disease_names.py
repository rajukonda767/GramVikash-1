# backend/app/utils/disease_names.py
"""
Complete Disease Catalog for all 20 classes in plant_disease_model.keras
(10 Paddy Diseases + 10 Tomato Diseases)
"""

DISEASE_CLASS_NAMES = [
    "paddy_bacterial_leaf_blight",
    "paddy_bacterial_leaf_streak",
    "paddy_bacterial_panicle_blight",
    "paddy_blast",
    "paddy_brown_spot",
    "paddy_dead_heart",
    "paddy_downy_mildew",
    "paddy_hispa",
    "paddy_normal",
    "paddy_tungro",
    "tomato_Tomato_Bacterial_spot",
    "tomato_Tomato_Early_blight",
    "tomato_Tomato_Late_blight",
    "tomato_Tomato_Leaf_Mold",
    "tomato_Tomato_Septoria_leaf_spot",
    "tomato_Tomato_Spider_mites_Two_spotted_spider_mite",
    "tomato_Tomato__Target_Spot",
    "tomato_Tomato__Tomato_YellowLeaf__Curl_Virus",
    "tomato_Tomato__Tomato_mosaic_virus",
    "tomato_Tomato_healthy"
]

DISEASE_METADATA = {
    # ---------------- PADDY DISEASES ----------------
    "paddy_bacterial_leaf_blight": {
        "crop": "Paddy",
        "name": {"en": "Bacterial Leaf Blight", "te": "వరి బ్యాక్టీరియల్ ఆకు ఎండు తెగులు (BLB)", "hi": "धान का जीवाणु पत्ती झुलसा"},
        "severity": "moderate",
        "is_healthy": False,
        "symptoms": {
            "en": "Water-soaked to yellowish-white lesions along leaf margins with wavy borders.",
            "te": "ఆకుల అంచుల వెంబడి నీటి చారలు మరియు పసుపు-తెలుపు రంగులోకి మారి ఎండిపోవడం.",
            "hi": "पत्तियों के किनारों पर पानी से भीगे हुए पीले-सफेद घाव और सूखना।"
        },
        "treatments": [
            {"step": 1, "en": "Drain excess water from the field for 3-4 days to arrest bacterial spread.", "te": "తెగులు వ్యాప్తి ఆగడానికి పొలంలో నీటిని 3-4 రోజులు తీసివేయండి.", "hi": "जीवाणु के फैलाव को रोकने के लिए खेत से 3-4 दिन पानी निकाल दें।"},
            {"step": 2, "en": "Spray Streptocycline (1g) + Copper Oxychloride (30g) in 10 liters of water.", "te": "10 లీటర్ల నీటిలో స్ట్రెప్టోసైక్లిన్ (1 గ్రా) + కాపర్ ఆక్సిక్లోరైడ్ (30 గ్రా) కలిపి పిచికారీ చేయండి.", "hi": "10 लीटर पानी में स्ट्रेप्टोसाइक्लिन (1 ग्राम) + कॉपर ऑक्सीक्लोराइड (30 ग्राम) मिलाकर छिड़कें।"},
            {"step": 3, "en": "Temporarily reduce top-dressing of Nitrogen (Urea) fertilizer.", "te": "తాత్కాలికంగా నత్రజని (యూరియా) ఎరువు వాడకాన్ని తగ్గించండి.", "hi": "अस्थायी रूप से नाइट्रोजन खाद का उपयोग कम करें।"}
        ]
    },
    "paddy_bacterial_leaf_streak": {
        "crop": "Paddy",
        "name": {"en": "Bacterial Leaf Streak", "te": "వరి బ్యాక్టీరియల్ లీఫ్ స్ట్రీక్", "hi": "धान का जीवाणु पत्ती धारी रोग"},
        "severity": "mild",
        "is_healthy": False,
        "symptoms": {
            "en": "Narrow, brownish translucent streaks between leaf veins with tiny amber droplets.",
            "te": "ఆకు ఈనెల మధ్య సన్నని గోధుమ రంగు చారలు మరియు జిగురు చుక్కలు ఏర్పడటం.",
            "hi": "पत्तियों की नसों के बीच संकीर्ण, भूरी पारभासी धारियां।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Copper Hydroxide @ 2g per liter of water.", "te": "లీటరు నీటికి కాపర్ హైడ్రాక్సైడ్ 2 గ్రా కలిపి పిచికారీ చేయండి.", "hi": "कॉपर हाइड्रॉक्साइड 2 ग्राम प्रति लीटर पानी में छिड़कें।"},
            {"step": 2, "en": "Maintain proper field spacing and avoid heavy nitrogen dose.", "te": "సరైన దూరం పాటించండి మరియు నత్రజని మోతాదు తగ్గించండి.", "hi": "खेत में उचित दूरी रखें और नाइट्रोजन की मात्रा कम करें।"},
            {"step": 3, "en": "Ensure balanced Potassium fertilizer application.", "te": "పొటాష్ ఎరువును సమతుల్యంగా వేయండి.", "hi": "पोटाश खाद का संतुलित उपयोग करें।"}
        ]
    },
    "paddy_bacterial_panicle_blight": {
        "crop": "Paddy",
        "name": {"en": "Bacterial Panicle Blight", "te": "వరి పానికల్ బ్లైట్ / కంకి ఎండు తెగులు", "hi": "धान का कली झुलसा रोग"},
        "severity": "severe",
        "is_healthy": False,
        "symptoms": {
            "en": "Discoloration and blighting of panicles, leading to chaffy grains.",
            "te": "కంకులు ఎండిపోయి గింజలు తాలుగా మారడం.",
            "hi": "बालियों का सूखना और दाने खोखले होना।"
        },
        "treatments": [
            {"step": 1, "en": "Apply Copper Oxychloride @ 30g + Kasugamycin @ 25ml in 10L water.", "te": "10 లీటర్ల నీటిలో కాపర్ ఆక్సిక్లోరైడ్ 30 గ్రా + కసుగామైసిన్ 25 మి.లీ కలిపి చల్లండి.", "hi": "कॉपर ऑक्सीक्लोराइड 30 ग्राम + कासुगामाइसिन 25 मिली छिड़कें।"},
            {"step": 2, "en": "Avoid water stress during the heading and flowering stage.", "te": "ఈత మరియు పూత దశలో నీటి కొరత రాకుండా చూడండి.", "hi": "फूल आने के समय पानी की कमी न होने दें।"},
            {"step": 3, "en": "Use certified disease-free seed in next cycle.", "te": "తదుపరి పంటకు ధృవీకరించిన విత్తనాలను వాడండి.", "hi": "अगली बार प्रमाणित बीजों का ही उपयोग करें।"}
        ]
    },
    "paddy_blast": {
        "crop": "Paddy",
        "name": {"en": "Rice Blast", "te": "వరి మెడ విరుపు / అగ్గితెగులు (Rice Blast)", "hi": "धान का ब्लास्ट रोग (झोंका)"},
        "severity": "severe",
        "is_healthy": False,
        "symptoms": {
            "en": "Spindle-shaped elliptical spots with grey centers and dark brown margins.",
            "te": "ఆకులపై కంటి లేదా పడవ ఆకారపు మచ్చలు, బూడిద రంగు కేంద్రం మరియు గోధుమ అంచులు.",
            "hi": "पत्तियों पर आंख के आकार के धब्बे, धूसर केंद्र और भूरे किनारे।"
        },
        "treatments": [
            {"step": 1, "en": "Immediately spray Tricyclazole 75 WP @ 0.6g per liter of water.", "te": "వెంటనే ట్రైసైక్లాజోల్ 75 WP ను లీటరు నీటికి 0.6 గ్రా చొప్పున కలిపి పిచికారీ చేయండి.", "hi": "तुरंत ट्राइसाइक्लाजोल 75 WP को 0.6 ग्राम प्रति लीटर पानी में मिलाकर छिड़कें।"},
            {"step": 2, "en": "Maintain shallow water level and avoid drying the field.", "te": "పొలంలో తేలికపాటి నీటి మట్టాన్ని ఉంచండి, ఎండనివ్వవద్దు.", "hi": "खेत में हल्का पानी बनाए रखें, खेत को सूखने न दें।"},
            {"step": 3, "en": "Spray early morning or evening for best absorption.", "te": "ఉదయం లేదా సాయంత్రం వేళల్లో పిచికారీ చేయండి.", "hi": "सुबह या शाम के समय छिड़काव करें।"}
        ]
    },
    "paddy_brown_spot": {
        "crop": "Paddy",
        "name": {"en": "Brown Spot", "te": "వరి గోధుమ రంగు మచ్చ తెగులు (Brown Spot)", "hi": "धान का भूरा धब्बा रोग"},
        "severity": "mild",
        "is_healthy": False,
        "symptoms": {
            "en": "Oval to circular dark brown spots with a yellow halo on leaves.",
            "te": "ఆకులపై గుండ్రని ముదురు గోధుమ రంగు మచ్చలు మరియు పసుపు రంగు వలయాలు.",
            "hi": "पत्तियों पर पीले घेरे के साथ गोल भूरे रंग के धब्बे।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Mancozeb @ 2.5g or Carbendazim @ 1g per liter of water.", "te": "లీటరు నీటికి మాంకోజెబ్ 2.5 గ్రా లేదా కార్బెండజిమ్ 1 గ్రా కలిపి చల్లండి.", "hi": "मैनकोजेब 2.5 ग्राम या कार्बेन्डाजिम 1 ग्राम प्रति लीटर पानी में छिड़कें।"},
            {"step": 2, "en": "Apply Potash and Micronutrients to improve disease resistance.", "te": "పొటాష్ మరియు సూక్ష్మపోషకాలు వేయడం ద్వారా మొక్కలకు తెగులు తట్టుకునే శక్తి పెరుగుతుంది.", "hi": "पोटाश और सूक्ष्म पोषक तत्व डालें जिससे रोग प्रतिरोधक क्षमता बढ़े।"},
            {"step": 3, "en": "Ensure balanced nutrition and avoid nutrient stress.", "te": "సమతుల్య ఎరువులను సకాలంలో అందించండి.", "hi": "संतुलित पोषण का ध्यान रखें।"}
        ]
    },
    "paddy_dead_heart": {
        "crop": "Paddy",
        "name": {"en": "Dead Heart (Stem Borer)", "te": "వరి కాండం తొలుచు పురుగు (డెడ్ హార్ట్)", "hi": "धान का तना छेदक (डेड हार्ट)"},
        "severity": "moderate",
        "is_healthy": False,
        "symptoms": {
            "en": "Central tiller dries up and pulls out easily with chewed stem base.",
            "te": "మొక్కల పిలకల మధ్యభాగం ఎండిపోయి సులభంగా ఊడిరావడం.",
            "hi": "पौधे का मुख्य तना सूख जाना और आसानी से खिंच जाना।"
        },
        "treatments": [
            {"step": 1, "en": "Broadcast Chlorantraniliprole 0.4% G (Ferterra) @ 4kg/acre with sand.", "te": "ఎకరాకు క్లోరాంట్రానిలిప్రోల్ 0.4% గుళికలు (ఫెర్టెర్రా) 4 కిలోలు ఇసుకలో కలిపి చల్లండి.", "hi": "खेत में क्लोरेंट्रानिलिप्रोल 0.4% जी 4 किग्रा प्रति एकड़ बालू में मिलाकर डालें।"},
            {"step": 2, "en": "Install pheromone traps @ 8 per acre for stem borer monitoring.", "te": "ఎకరాకు 8 లింగాకర్షక బుట్టలను అమర్చండి.", "hi": "प्रति एकड़ 8 फेरोमोन ट्रैप लगाएं।"},
            {"step": 3, "en": "Clip seedling tips before transplanting to remove egg masses.", "te": "నాట్లు వేసేటప్పుడు నారు కొసలను తుంచి వేయండి.", "hi": "रोपाई से पहले पौध के ऊपरी हिस्से को काट दें।"}
        ]
    },
    "paddy_downy_mildew": {
        "crop": "Paddy",
        "name": {"en": "Downy Mildew", "te": "వరి డౌనీ మిల్డ్యూ", "hi": "धान का डाउनी मिल्ड्यू"},
        "severity": "moderate",
        "is_healthy": False,
        "symptoms": {
            "en": "Yellowish-green mottling and whitish downy growth under leaves.",
            "te": "ఆకుల అడుగున తెల్లని బూజు మరియు పసుపు పచ్చని చారలు ఏర్పడటం.",
            "hi": "पत्तियों की निचली सतह पर सफेद फफूंद और पीलापन।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Metalaxyl + Mancozeb (Ridomil MZ) @ 2.5g per liter of water.", "te": "లీటరు నీటికి రిడోమిల్ MZ 2.5 గ్రా కలిపి పిచికారీ చేయండి.", "hi": "रिडोमिल 2.5 ग्राम प्रति लीटर पानी में छिड़कें।"},
            {"step": 2, "en": "Improve field aeration and drainage.", "te": "పొలంలో గాలి, వెలుతురు బాగుండేలా చూడండి.", "hi": "खेत में जल निकासी और वायु संचार सुधारें।"},
            {"step": 3, "en": "Remove severely infected seedlings.", "te": "తీవ్రంగా తెగులు సోకిన మొక్కలను పీకి నాశనం చేయండి.", "hi": "संक्रमित पौधों को उखाड़कर नष्ट करें।"}
        ]
    },
    "paddy_hispa": {
        "crop": "Paddy",
        "name": {"en": "Rice Hispa", "te": "వరి హిస్పా / ముళ్ల పురుగు", "hi": "धान का हिस्पा कीट"},
        "severity": "moderate",
        "is_healthy": False,
        "symptoms": {
            "en": "Parallel white streaks on leaves giving a burnt/bleached appearance.",
            "te": "ఆకులపై సమాంతరంగా తెల్లటి చారలు ఏర్పడి ఎండిపోయినట్లు కనిపించడం.",
            "hi": "पत्तियों पर सफेद समानांतर धारियां जिससे पत्तियां झुलसी हुई दिखती हैं।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Chlorpyrifos 20 EC @ 2.5ml per liter of water.", "te": "లీటరు నీటికి క్లోరిపైరిఫాస్ 20 EC 2.5 మి.లీ కలిపి పిచికారీ చేయండి.", "hi": "क्लोरपायरीफॉस 20 ईसी 2.5 मिली प्रति लीटर पानी में छिड़कें।"},
            {"step": 2, "en": "Pass a rope or sweep net across the canopy in morning to dislodge beetles.", "te": "ఉదయం పూట తాడును పంట పైనుండి లాగడం ద్వారా పురుగులను రాల్చండి.", "hi": "सुबह के समय खेत में रस्सी चलाकर कीड़ों को गिराएं।"},
            {"step": 3, "en": "Remove grassy weeds from field bunds.", "te": "గట్లపై ఉన్న కలుపు మొక్కలను తొలగించండి.", "hi": "मेड़ों से खरपतवार हटाएं।"}
        ]
    },
    "paddy_normal": {
        "crop": "Paddy",
        "name": {"en": "Healthy Paddy Crop", "te": "ఆరోగ్యకరమైన వరి పంట 🌱", "hi": "स्वस्थ धान की फसल 🌱"},
        "severity": "healthy",
        "is_healthy": True,
        "symptoms": {
            "en": "Vibrant green leaves, uniform growth, robust root system.",
            "te": "ఆకులు పచ్చగా, ఏపుగా మరియు ఎటువంటి తెగులు మచ్చలు లేకుండా ఉన్నాయి.",
            "hi": "पत्तियां हरी-भरी और स्वस्थ हैं, कोई रोग के लक्षण नहीं हैं।"
        },
        "treatments": [
            {"step": 1, "en": "Maintain regular scheduled irrigation.", "te": "క్రమం తప్పకుండా సమతుల్య నీటిపారుదల అందించండి.", "hi": "नियमित रूप से सिंचाई जारी रखें।"},
            {"step": 2, "en": "Apply scheduled split doses of Nitrogen and Potash.", "te": "షెడ్యూల్ ప్రకారం ఎరువులను అందించండి.", "hi": "समय पर निर्धारित खाद दें।"},
            {"step": 3, "en": "Scout weekly for any early pest occurrence.", "te": "వారానికొకసారి పంటను నిశితంగా పరిశీలించండి.", "hi": "सप्ताह में एक बार फसल की निगरानी करें।"}
        ]
    },
    "paddy_tungro": {
        "crop": "Paddy",
        "name": {"en": "Tungro Virus", "te": "వరి టుంగ్రో వైరస్ తెగులు", "hi": "धान का टुंग्रो वायरस रोग"},
        "severity": "severe",
        "is_healthy": False,
        "symptoms": {
            "en": "Yellow-orange discoloration starting from leaf tips, severe stunting.",
            "te": "ఆకు కొసల నుండి పసుపు-నారింజ రంగులోకి మారి మొక్కల ఎదుగుదల ఆగిపోవడం.",
            "hi": "पत्तियों का ऊपरी भाग से पीला-नारंगी होना और पौधे का बौना रह जाना।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Imidacloprid 17.8 SL @ 0.3ml/L or Thiamethoxam @ 0.3g/L to control vector Green Leafhopper.", "te": "పచ్చదోమ నివారణకు లీటరు నీటికి ఇమిడాక్లోప్రిడ్ 0.3 మి.లీ లేదా థయామెథాక్సమ్ 0.3 గ్రా కలిపి పిచికారీ చేయండి.", "hi": "हरा फुदका कीट नियंत्रण के लिए इमिडाक्लोप्रिड 0.3 मिली प्रति लीटर छिड़कें।"},
            {"step": 2, "en": "Uproot and destroy infected stunted plants.", "te": "తెగులు సోకిన గిడసబారిన మొక్కలను పీకి కాల్చివేయండి.", "hi": "संक्रमित पौधों को उखाड़कर नष्ट करें।"},
            {"step": 3, "en": "Apply zinc sulphate to aid crop recovery.", "te": "జింక్ సల్ఫేట్ వేయడం ద్వారా రికవరీని వేగవంతం చేయండి.", "hi": "जिंक सल्फेट का छिड़काव करें।"}
        ]
    },

    # ---------------- TOMATO DISEASES ----------------
    "tomato_Tomato_Bacterial_spot": {
        "crop": "Tomato",
        "name": {"en": "Tomato Bacterial Spot", "te": "టమాటో బ్యాక్టీరియల్ స్పాట్", "hi": "टमाटर का जीवाणु धब्बा रोग"},
        "severity": "moderate",
        "is_healthy": False,
        "symptoms": {
            "en": "Small, dark, greasy water-soaked spots on leaves and fruit with yellow halos.",
            "te": "ఆకులు మరియు కాయలపై చిన్న నల్లటి జిడ్డు మచ్చలు ఏర్పడటం.",
            "hi": "पत्तियों और फलों पर छोटे गहरे चिकने पानी से भीगे धब्बे।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Copper Oxychloride @ 3g + Streptocycline @ 0.1g per liter of water.", "te": "లీటరు నీటికి కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రా + స్ట్రెప్టోసైక్లిన్ 0.1 గ్రా కలిపి చల్లండి.", "hi": "कॉपर ऑक्सीक्लोराइड 3 ग्राम + स्ट्रेप्टोसाइक्लिन 0.1 ग्राम प्रति लीटर पानी में छिड़कें।"},
            {"step": 2, "en": "Avoid overhead sprinkler irrigation to keep foliage dry.", "te": "ఆకులపై నీరు పడకుండా డ్రిప్ ద్వారా మాత్రమే నీరందించండి.", "hi": "पत्तियों को सूखा रखने के लिए ड्रिप सिंचाई का उपयोग करें।"},
            {"step": 3, "en": "Remove infected lower leaves.", "te": "తెగులు సోకిన కింది ఆకులను తుంచి నాశనం చేయండి.", "hi": "रोगग्रस्त निचली पत्तियों को हटा दें।"}
        ]
    },
    "tomato_Tomato_Early_blight": {
        "crop": "Tomato",
        "name": {"en": "Tomato Early Blight", "te": "టమాటో ఆల్టర్నేరియా ఆకు ఎండు తెగులు (Early Blight)", "hi": "टमाटर का अगेती झुलसा रोग"},
        "severity": "moderate",
        "is_healthy": False,
        "symptoms": {
            "en": "Target-like concentric brown rings with yellow halo on older lower leaves.",
            "te": "కింది ఆకులపై వలయాల వంటి గోధుమ రంగు మచ్చలు మరియు పసుపు వలయాలు ఏర్పడటం.",
            "hi": "निचली पत्तियों पर गोल छल्लों वाले गहरे भूरे धब्बे।"
        },
        "treatments": [
            {"step": 1, "en": "Prune and destroy infected lower leaves touching the ground.", "te": "నేలకు తాకుతున్న తెగులు సోకిన కింది ఆకులను కత్తిరించి నాశనం చేయండి.", "hi": "रोगग्रस्त निचली पत्तियों को काटकर नष्ट कर दें।"},
            {"step": 2, "en": "Spray Chlorothalonil @ 2g or Mancozeb @ 2.5g per liter of water.", "te": "లీటరు నీటికి క్లోరోథలోనిల్ 2 గ్రా లేదా మాంకోజెబ్ 2.5 గ్రా కలిపి పిచికారీ చేయండి.", "hi": "क्लोरोथैलोनिल 2 ग्राम या मैनकोजेब 2.5 ग्राम प्रति लीटर पानी में छिड़कें।"},
            {"step": 3, "en": "Apply mulch around plants to prevent soil splashing.", "te": "మొక్కల చుట్టూ మల్చింగ్ వేయండి.", "hi": "पौधों के चारों ओर मल्चिंग का उपयोग करें।"}
        ]
    },
    "tomato_Tomato_Late_blight": {
        "crop": "Tomato",
        "name": {"en": "Tomato Late Blight", "te": "టమాటో లేట్ బ్లైట్ / మాడ తెగులు", "hi": "टमाटर का पछेती झुलसा रोग"},
        "severity": "severe",
        "is_healthy": False,
        "symptoms": {
            "en": "Large, irregular water-soaked lesions with white fuzzy fungal growth on underside.",
            "te": "ఆకుల అడుగున తెల్లని బూజుతో కూడిన పెద్ద ముదురు గోధుమ రంగు మచ్చలు.",
            "hi": "पत्तियों पर बड़े पानी से भीगे भूरे धब्बे और निचली सतह पर सफेद फफूंद।"
        },
        "treatments": [
            {"step": 1, "en": "Immediately spray Metalaxyl + Mancozeb (Ridomil MZ) @ 2.5g per liter.", "te": "వెంటనే రిడోమిల్ MZ 2.5 గ్రా లీటరు నీటికి కలిపి పిచికారీ చేయండి.", "hi": "तुरंत रिडोमिल 2.5 ग्राम प्रति लीटर पानी में मिलाकर छिड़कें।"},
            {"step": 2, "en": "Ensure proper spacing and drainage to reduce humidity in canopy.", "te": "పొలంలో తేమ తగ్గడానికి గాలి ప్రసరణ బాగుండేలా చూడండి.", "hi": "हवा का प्रवाह बढ़ाने के लिए उचित दूरी रखें।"},
            {"step": 3, "en": "Repeat spray after 7 days if cool rainy weather persists.", "te": "వర్షపు వాతావరణం కొనసాగితే 7 రోజుల తర్వాత మళ్లీ పిచికారీ చేయండి.", "hi": "मौसम नम रहने पर 7 दिन बाद दोबारा छिड़काव करें।"}
        ]
    },
    "tomato_Tomato_Leaf_Mold": {
        "crop": "Tomato",
        "name": {"en": "Tomato Leaf Mold", "te": "టమాటో ఆకు బూజు తెగులు", "hi": "टमाटर का लीफ मोल्ड"},
        "severity": "mild",
        "is_healthy": False,
        "symptoms": {
            "en": "Pale green/yellow spots on upper leaf surface with olive-green mold underneath.",
            "te": "ఆకు పైభాగంలో పసుపు మచ్చలు మరియు అడుగున ఆలివ్ ఆకుపచ్చ రంగు బూజు.",
            "hi": "पत्तियों की ऊपरी सतह पर पीले धब्बे और निचली सतह पर फफूंद।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Difenoconazole @ 0.5ml or Mancozeb @ 2.5g per liter.", "te": "లీటరు నీటికి డైఫెనోకోనజోల్ 0.5 మి.లీ లేదా మాంకోజెబ్ 2.5 గ్రా కలిపి చల్లండి.", "hi": "डिफेनोकोनाजोल 0.5 मिली प्रति लीटर पानी में छिड़कें।"},
            {"step": 2, "en": "Prune excess suckers to improve sunlight penetration.", "te": "సూర్యరశ్మి బాగా తగిలేలా అదనపు కొమ్మలను కత్తిరించండి.", "hi": "धूप के लिए अतिरिक्त शाखाओं की छंटाई करें।"},
            {"step": 3, "en": "Keep relative humidity below 85% if in polyhouse.", "te": "పాలీహౌస్‌లో తేమను 85% లోపు ఉంచండి.", "hi": "पॉलीहाउस में नमी नियंत्रित रखें।"}
        ]
    },
    "tomato_Tomato_Septoria_leaf_spot": {
        "crop": "Tomato",
        "name": {"en": "Septoria Leaf Spot", "te": "టమాటో సెప్టోరియా ఆకు మచ్చ తెగులు", "hi": "टमाटर का सेप्टोरिया पत्ती धब्बा"},
        "severity": "moderate",
        "is_healthy": False,
        "symptoms": {
            "en": "Numerous small circular spots with grey-white centers and dark brown margins.",
            "te": "బూడిద రంగు కేంద్రం మరియు ముదురు గోధుమ అంచులతో చిన్న చిన్న గుండ్రని మచ్చలు.",
            "hi": "गहरे भूरे किनारों और सफेद केंद्र वाले छोटे गोल धब्बे।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Azoxystrobin @ 1ml or Copper Oxychloride @ 3g per liter.", "te": "లీటరు నీటికి అజాక్సిస్ట్రోబిన్ 1 మి.లీ లేదా కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రా కలిపి చల్లండి.", "hi": "एजॉक्सीस्ट्रोबिन 1 मिली प्रति लीटर पानी में छिड़कें।"},
            {"step": 2, "en": "Remove and dispose of infected bottom foliage.", "te": "తెగులు సోకిన కింది ఆకులను తీసివేయండి.", "hi": "रोगग्रस्त पत्तियों को तोड़कर नष्ट करें।"},
            {"step": 3, "en": "Stake plants properly to keep leaves off soil.", "te": "మొక్కలను కర్రలకు కట్టండి.", "hi": "पौधों को सहारा देकर जमीन से ऊपर रखें।"}
        ]
    },
    "tomato_Tomato_Spider_mites_Two_spotted_spider_mite": {
        "crop": "Tomato",
        "name": {"en": "Two-Spotted Spider Mite", "te": "టమాటో ఎర్ర నల్లి / స్పైడర్ మైట్", "hi": "टमाटर का लाल मकड़ी कीट"},
        "severity": "moderate",
        "is_healthy": False,
        "symptoms": {
            "en": "Fine yellow stippling on leaves with fine silken webbing on undersides.",
            "te": "ఆకులపై చిన్న పసుపు రంగు చుక్కలు మరియు ఆకు అడుగున సాలెగూడు వలలు.",
            "hi": "पत्तियों पर बारीक पीले बिंदु और निचली सतह पर बारीक जाला।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Spiromesifen (Oberon) @ 1ml or Abamectin @ 0.5ml per liter.", "te": "లీటరు నీటికి ఒబెరాన్ 1 మి.లీ లేదా అబామెక్టిన్ 0.5 మి.లీ కలిపి పిచికారీ చేయండి.", "hi": "ओबेरॉन 1 मिली या एबामेक्टिन 0.5 मिली प्रति लीटर छिड़कें।"},
            {"step": 2, "en": "Spray water forcefully on leaf undersides to disrupt webbing.", "te": "ఆకుల అడుగున నీటిని ఫోర్స్‌గా పిచికారీ చేసి గూళ్లను తొలగించండి.", "hi": "पत्तियों की निचली सतह पर तेज पानी की धार मारें।"},
            {"step": 3, "en": "Avoid broad-spectrum pyrethroids which kill beneficial predatory mites.", "te": "మిత్ర పురుగులకు హాని కలిగించే సింథటిక్ పైరెథ్రాయిడ్స్ వాడకండి.", "hi": "हानिकारक कीटनाशकों से बचें जो मित्र कीटों को मारते हैं।"}
        ]
    },
    "tomato_Tomato__Target_Spot": {
        "crop": "Tomato",
        "name": {"en": "Tomato Target Spot", "te": "టమాటో టార్గెట్ స్పాట్", "hi": "टमाटर का टारगेट स्पॉट"},
        "severity": "moderate",
        "is_healthy": False,
        "symptoms": {
            "en": "Brown circular lesions with concentric rings and chlorotic halos.",
            "te": "వలయాకారపు గోధుమ రంగు మచ్చలు మరియు పసుపు వలయాలు.",
            "hi": "गोल भूरे घाव और पीले घेरे।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Pyraclostrobin @ 1ml or Azoxystrobin @ 1ml per liter.", "te": "లీటరు నీటికి పైరాక్లోస్ట్రోబిన్ 1 మి.లీ కలిపి చల్లండి.", "hi": "पाइराक्लोस्ट्रोबिन 1 मिली प्रति लीटर छिड़कें।"},
            {"step": 2, "en": "Improve field drainage and plant spacing.", "te": "పొలంలో నీరు నిలవకుండా చూడండి.", "hi": "जल निकासी और पौधों की दूरी सुधारें।"},
            {"step": 3, "en": "Follow crop rotation with non-solanaceous crops.", "te": "పంట మార్పిడి పద్ధతిని పాటించండి.", "hi": "फसल चक्र अपनाएं।"}
        ]
    },
    "tomato_Tomato__Tomato_YellowLeaf__Curl_Virus": {
        "crop": "Tomato",
        "name": {"en": "Yellow Leaf Curl Virus (TYLCV)", "te": "టమాటో ఆకు ముడుత / జెమిని వైరస్ (TYLCV)", "hi": "टमाटर का पत्ती मोड़क वायरस (TYLCV)"},
        "severity": "severe",
        "is_healthy": False,
        "symptoms": {
            "en": "Upward curling and cupping of leaves, yellow margins, severe stunting and flower drop.",
            "te": "ఆకులు పైకి ముడుచుకుపోవడం, పసుపు రంగులోకి మారడం, పూత రాలిపోవడం.",
            "hi": "पत्तियों का ऊपर की ओर मुड़ना, पीलापन, पौधे का रुक जाना और फूल गिरना।"
        },
        "treatments": [
            {"step": 1, "en": "Spray Diafenthiuron 50 WP @ 1.2g or Acetamiprid @ 0.5g/L to control vector Whitefly.", "te": "తెల్లదోమ నివారణకు డయాఫెంథియురాన్ 1.2 గ్రా లేదా ఎసిటామిప్రిడ్ 0.5 గ్రా లీటరు నీటికి కలిపి చల్లండి.", "hi": "सफेद मक्खी नियंत्रण के लिए एसिटामिप्रिड 0.5 ग्राम प्रति लीटर छिड़कें।"},
            {"step": 2, "en": "Install yellow sticky traps @ 20 per acre.", "te": "ఎకరాకు 20 పసుపు రంగు జిగురు అట్టలను అమర్చండి.", "hi": "प्रति एकड़ 20 पीले चिपचिपे जाल लगाएं।"},
            {"step": 3, "en": "Uproot and destroy early infected virus-carrying plants.", "te": "వైరస్ సోకిన మొక్కలను పీకి నాశనం చేయండి.", "hi": "संक्रमित पौधों को उखाड़कर तुरंत नष्ट करें।"}
        ]
    },
    "tomato_Tomato__Tomato_mosaic_virus": {
        "crop": "Tomato",
        "name": {"en": "Tomato Mosaic Virus (ToMV)", "te": "టమాటో మొజాయిక్ వైరస్ తెగులు", "hi": "टमाटर का मोज़ेक वायरस"},
        "severity": "severe",
        "is_healthy": False,
        "symptoms": {
            "en": "Mottled light and dark green patterns on leaves with blistering and distortion.",
            "te": "ఆకులపై ఆకుపచ్చ మరియు పసుపు రంగు మచ్చలు, ఆకులు వంకర్లు పోవడం.",
            "hi": "पत्तियों पर हल्के और गहरे हरे रंग के चितकबरे धब्बे और विकृति।"
        },
        "treatments": [
            {"step": 1, "en": "Disinfect tools with 10% TSP (Trisodium Phosphate) or bleach solution.", "te": "వ్యవసాయ పరికరాలను 10% బ్లీచ్ లేదా డెటాల్ ద్రావణంతో శుభ్రం చేయండి.", "hi": "उपकरणों को कीटाणुरहित करें।"},
            {"step": 2, "en": "Wash hands with soap before touching plants; avoid tobacco use near fields.", "te": "పొలంలో పనిచేసేటప్పుడు చేతులను సబ్బుతో కడుక్కోండి.", "hi": "पौधों को छूने से पहले साबुन से हाथ धोएं।"},
            {"step": 3, "en": "Remove infected plants immediately to prevent mechanical transmission.", "te": "వైరస్ సోకిన మొక్కలను వెంటనే తొలగించండి.", "hi": "संक्रमित पौधों को तुरंत हटा दें।"}
        ]
    },
    "tomato_Tomato_healthy": {
        "crop": "Tomato",
        "name": {"en": "Healthy Tomato Plant", "te": "ఆరోగ్యకరమైన టమాటో పంట 🌱", "hi": "स्वस्थ टमाटर का पौधा 🌱"},
        "severity": "healthy",
        "is_healthy": True,
        "symptoms": {
            "en": "Lush green leaves, sturdy stem, normal flowering and fruit set.",
            "te": "ఆకులు పచ్చగా, ఏపుగా మరియు పూత, పిందె ఆరోగ్యంగా ఉన్నాయి.",
            "hi": "पत्तियां हरी-भरी और स्वस्थ हैं, फूल और फल अच्छे आ रहे हैं।"
        },
        "treatments": [
            {"step": 1, "en": "Maintain consistent drip irrigation to prevent blossom end rot.", "te": "డ్రిప్ ద్వారా క్రమం తప్పకుండా సమానమైన తేమను అందించండి.", "hi": "ड्रिप से नियमित नमी बनाए रखें।"},
            {"step": 2, "en": "Stake and prune side shoots for maximum aeration.", "te": "మొక్కలకు కర్రల ఊతం ఇవ్వండి.", "hi": "पौधों को सहारा दें और हवादार बनाएं।"},
            {"step": 3, "en": "Apply scheduled calcium and potassium fertilizer.", "te": "షెడ్యూల్ ప్రకారం కాల్షియం మరియు పొటాషియం ఎరువులు వేయండి.", "hi": "समय पर कैल्शियम और पोटाश खाद दें।"}
        ]
    }
}

def get_disease_info(class_index_or_name: str | int) -> dict:
    """Returns structured disease details by index or class name string."""
    if isinstance(class_index_or_name, int) and 0 <= class_index_or_name < len(DISEASE_CLASS_NAMES):
        key = DISEASE_CLASS_NAMES[class_index_or_name]
    else:
        key = str(class_index_or_name)

    return DISEASE_METADATA.get(key, {
        "crop": "Crop",
        "name": {"en": key.replace("_", " ").title(), "te": key, "hi": key},
        "severity": "moderate",
        "is_healthy": "healthy" in key or "normal" in key,
        "symptoms": {"en": "Unspecified foliage pattern.", "te": "ఆకు లక్షణాలు", "hi": "पत्ती के लक्षण"},
        "treatments": [
            {"step": 1, "en": "Isolate affected plant parts.", "te": "తెగులు సోకిన భాగాలను తొలగించండి.", "hi": "प्रभावित भाग अलग करें।"},
            {"step": 2, "en": "Consult local Krishi Vigyan Kendra.", "te": "వ్యవసాయ శాస్త్రవేత్తలను సంప్రదించండి.", "hi": "कृषि विज्ञान केंद्र से संपर्क करें।"},
            {"step": 3, "en": "Maintain balanced moisture.", "te": "సమతుల్య తేమ ఉంచండి.", "hi": "संतुलित नमी रखें।"}
        ]
    })

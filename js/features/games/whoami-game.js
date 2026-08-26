// "Who Am I?" (من أنا؟) — flash-card game with difficulty levels.
// Each card shows a single clue about a person from the Bible.
// Clicking the card flips it to reveal that person's name.
// Difficulty levels: سهل (easy) / متوسط (medium) / صعب (hard).

// ============================================================
//   Level 1 — سهل (Easy)
// ============================================================
const WHOAMI_EASY_POOL = [
    { name: 'آدم', clue: 'أول إنسان خلقه الله ووضعه في جنة عدن.', category: 'شخصية كتابية', difficulty: 'سهل' },
    { name: 'حواء', clue: 'أول امرأة خلقها الله وكانت زوجة أول إنسان.', category: 'شخصية كتابية', difficulty: 'سهل' },
    { name: 'نوح', clue: 'بنى سفينة ضخمة وأنقذ عائلته والحيوانات من الطوفان.', category: 'نبي', difficulty: 'سهل' },
    { name: 'إبراهيم', clue: 'دعاه الله أبا للشعوب ووعده بنسل كنجوم السماء.', category: 'أب الآباء', difficulty: 'سهل' },
    { name: 'إسحاق', clue: 'كان ابن الوعد الذي ولد لإبراهيم وسارة في شيخوختهما.', category: 'أب الآباء', difficulty: 'سهل' },
    { name: 'يعقوب', clue: 'صار اسمه إسرائيل وكان له اثنا عشر ابنا صاروا أسباط إسرائيل.', category: 'أب الآباء', difficulty: 'سهل' },
    { name: 'يوسف', clue: 'باعه إخوته عبدا لكنه أصبح حاكما في مصر وأنقذ عائلته من المجاعة.', category: 'شخصية كتابية', difficulty: 'سهل' },
    { name: 'موسى', clue: 'قاد شعب إسرائيل خارج مصر فانشق البحر أمامهم.', category: 'نبي', difficulty: 'سهل' },
    { name: 'يشوع', clue: 'قاد شعب إسرائيل بعد موسى وسقطت أسوار أريحا في أيامه.', category: 'قائد', difficulty: 'سهل' },
    { name: 'شمشون', clue: 'كان قويا جدا وكانت قوته مرتبطة بنذره وشعره.', category: 'قاضٍ', difficulty: 'سهل' },
    { name: 'صموئيل', clue: 'كان نبيا وقاضيا ومسح شاول ثم داود ملكين على إسرائيل.', category: 'نبي', difficulty: 'سهل' },
    { name: 'داود', clue: 'كان راعيا صغيرا قتل جليات بمقلاع ثم أصبح ملكا.', category: 'ملك', difficulty: 'سهل' },
    { name: 'سليمان', clue: 'اشتهر بحكمته العظيمة وبنى الهيكل في أورشليم.', category: 'ملك', difficulty: 'سهل' },
    { name: 'إيليا', clue: 'واجه أنبياء البعل على جبل الكرمل ونزلت نار من السماء.', category: 'نبي', difficulty: 'سهل' },
    { name: 'أليشع', clue: 'كان تلميذ إيليا واستمر في خدمته بعد صعود معلمه.', category: 'نبي', difficulty: 'سهل' },
    { name: 'دانيال', clue: 'ألقي في جب الأسود بسبب صلاته إلى الله لكن الله أنقذه.', category: 'نبي', difficulty: 'سهل' },
    { name: 'يونان', clue: 'هرب من دعوة الله وابتلعه حوت ثم عاد ليكرز لأهل نينوى.', category: 'نبي', difficulty: 'سهل' },
    { name: 'مريم', clue: 'كانت أم يسوع وسمعت من الملاك أنها ستلد ابن الله.', category: 'شخصية كتابية', difficulty: 'سهل' },
    { name: 'يوسف النجار', clue: 'كان خطيب مريم واعتنى بيسوع في طفولته.', category: 'شخصية كتابية', difficulty: 'سهل' },
    { name: 'بطرس', clue: 'كان صيادا وترك شباكه ليتبع يسوع وصار من أبرز تلاميذه.', category: 'تلميذ', difficulty: 'سهل' },
    { name: 'يوحنا', clue: 'كان من أقرب تلاميذ يسوع ووصف بأنه التلميذ الذي كان يسوع يحبه.', category: 'تلميذ', difficulty: 'سهل' },
    { name: 'متى', clue: 'كان جابي ضرائب ترك عمله عندما دعاه يسوع ليتبعه.', category: 'تلميذ', difficulty: 'سهل' },
    { name: 'مرقس', clue: 'كتب إنجيلا قصيرا يروي حياة يسوع وخدمته.', category: 'كاتب إنجيل', difficulty: 'سهل' },
    { name: 'لوقا', clue: 'كان طبيبا وكتب إنجيلا وسفر أعمال الرسل.', category: 'كاتب إنجيل', difficulty: 'سهل' },
    { name: 'بولس', clue: 'كان يضطهد أتباع يسوع ثم ظهر له المسيح في الطريق إلى دمشق.', category: 'رسول', difficulty: 'سهل' },
    { name: 'زكا', clue: 'كان رئيسا للعشارين وصعد على شجرة الجميز ليرى يسوع.', category: 'شخصية كتابية', difficulty: 'سهل' },
    { name: 'لعازر', clue: 'مات ثم أقامه يسوع من الموت أمام أختيه.', category: 'شخصية كتابية', difficulty: 'سهل' },
    { name: 'مرثا', clue: 'كانت أخت لعازر ومريم وكانت منشغلة بالخدمة عندما زارهم يسوع.', category: 'شخصية كتابية', difficulty: 'سهل' },
    { name: 'مريم المجدلية', clue: 'كانت من النساء اللواتي تبعن يسوع ورأينه بعد القيامة.', category: 'شخصية كتابية', difficulty: 'سهل' }
];

// ============================================================
//   Level 2 — متوسط (Medium)
// ============================================================
const WHOAMI_MEDIUM_POOL = [
    { name: 'قايين', clue: 'قدم قربانا لله ثم قتل أخاه هابيل بسبب الغيرة.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'هابيل', clue: 'قدم من أبكار غنمه قربانا للرب وقتل على يد أخيه.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'لوط', clue: 'نجا من خراب سدوم وعمورة بعد أن أرسل الله ملائكة لإنقاذه.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'سارة', clue: 'كانت زوجة إبراهيم وضحكت عندما سمعت أنها ستلد ابنا في شيخوختها.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'رفقة', clue: 'كانت زوجة إسحاق وساعدت ابنها يعقوب في الحصول على البركة.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'راحيل', clue: 'أحبها يعقوب وانتظر سنوات ليتزوجها وكانت أم يوسف وبنيامين.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'مريم أخت موسى', clue: 'كانت أخت موسى وهارون وقادت النساء بالدفوف بعد عبور البحر.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'هارون', clue: 'كان أخا موسى وأول رئيس كهنة لشعب إسرائيل.', category: 'كاهن', difficulty: 'متوسط' },
    { name: 'راحاب', clue: 'كانت تسكن في أريحا وأخفت الجاسوسين وساعدتهما على الهرب.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'جدعون', clue: 'حارب المديانيين بجيش صغير بعد أن قلل الله عدد جنوده.', category: 'قاضٍ', difficulty: 'متوسط' },
    { name: 'دبورة', clue: 'كانت نبية وقاضية قادت إسرائيل وشجعت باراق في الحرب.', category: 'قاضية', difficulty: 'متوسط' },
    { name: 'راعوث', clue: 'تركت أرضها وشعبها لتبقى مع حماتها.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'أستير', clue: 'أصبحت ملكة واستخدمت مكانتها لإنقاذ شعبها من مؤامرة.', category: 'ملكة', difficulty: 'متوسط' },
    { name: 'مردخاي', clue: 'ربي أستير وكشف مؤامرة ضد الملك وساعد في إنقاذ اليهود.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'أيوب', clue: 'فقد ممتلكاته وأولاده وصحته لكنه تمسك بإيمانه بالله.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'أرميا', clue: 'بكى على خراب أورشليم ولقب بالنبي الباكي.', category: 'نبي', difficulty: 'متوسط' },
    { name: 'إشعياء', clue: 'رأى الرب جالسا وسمع السرافيم يسبحون قدوس قدوس قدوس.', category: 'نبي', difficulty: 'متوسط' },
    { name: 'حزقيال', clue: 'رأى وادي العظام اليابسة التي عادت إليها الحياة.', category: 'نبي', difficulty: 'متوسط' },
    { name: 'ملاخي', clue: 'كان آخر أنبياء العهد القديم وكتب سفرا يحمل اسمه.', category: 'نبي', difficulty: 'متوسط' },
    { name: 'يوحنا المعمدان', clue: 'كان يكرز بالتوبة ويعمد الناس في نهر الأردن ومهد الطريق للمسيح.', category: 'نبي', difficulty: 'متوسط' },
    { name: 'نيقوديموس', clue: 'كان من رؤساء اليهود وجاء إلى يسوع ليلا وتحدث معه عن الولادة الجديدة.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'السامري الصالح', clue: 'رأى رجلا مجروحا على الطريق فتوقف وضمد جراحه واعتنى به.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'توما', clue: 'شك في قيامة يسوع حتى رأى آثار المسامير والجنب.', category: 'تلميذ', difficulty: 'متوسط' },
    { name: 'يعقوب بن زبدي', clue: 'كان صيادا وأخا ليوحنا وكان من التلاميذ الأقرب إلى يسوع.', category: 'تلميذ', difficulty: 'متوسط' },
    { name: 'أندراوس', clue: 'كان أول من أخبر أخاه سمعان بطرس أنه وجد المسيح.', category: 'تلميذ', difficulty: 'متوسط' },
    { name: 'فيليبس', clue: 'دعاه يسوع ليتبعه وكان هو الذي أخبر نثنائيل عن المسيح.', category: 'تلميذ', difficulty: 'متوسط' },
    { name: 'برنابا', clue: 'كان معروفا بالتشجيع وباع حقلا ووضع ثمنه عند أقدام الرسل.', category: 'رسول', difficulty: 'متوسط' },
    { name: 'استفانوس', clue: 'كان أول شهيد مسيحي ورأى السماوات مفتوحة قبل موته.', category: 'شهيد', difficulty: 'متوسط' },
    { name: 'فيليبس المبشر', clue: 'شرح للخصي الحبشي نبوة إشعياء وعمده بعد أن آمن.', category: 'مبشر', difficulty: 'متوسط' },
    { name: 'تيموثاوس', clue: 'كان شابا خدم مع بولس وتلقى منه رسالتين تحملان اسمه.', category: 'خادم', difficulty: 'متوسط' },
    { name: 'تيطس', clue: 'كان شريكا لبولس في الخدمة وأرسل إليه بولس رسالة باسمه.', category: 'خادم', difficulty: 'متوسط' },
    { name: 'بيلاطس', clue: 'كان الوالي الروماني الذي حكم على يسوع بالصلب رغم براءته.', category: 'حاكم', difficulty: 'متوسط' },
    { name: 'هيرودس', clue: 'كان ملكا وقتل يوحنا المعمدان بعد طلب ابنة هيروديا.', category: 'ملك', difficulty: 'متوسط' },
    { name: 'قيافا', clue: 'كان رئيس الكهنة وقت محاكمة يسوع وشارك في تسليمه للموت.', category: 'رئيس كهنة', difficulty: 'متوسط' },
    { name: 'باراباس', clue: 'كان سجينا أطلقه بيلاطس بدل يسوع أمام طلب الجمهور.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'يوسف الرامي', clue: 'كان تلميذا ليسوع ووضع جسده في قبر جديد بعد الصلب.', category: 'تلميذ', difficulty: 'متوسط' },
    { name: 'سمعان القيرواني', clue: 'أجبر على حمل صليب يسوع في الطريق إلى الجلجثة.', category: 'شخصية كتابية', difficulty: 'متوسط' },
    { name: 'مريم ومرثا', clue: 'كانتا أختين عاشتا مع أخيهما لعازر وكان يسوع يحبهما.', category: 'شخصيات كتابية', difficulty: 'متوسط' }
];

// ============================================================
//   Level 3 — صعب (Hard)
// ============================================================
const WHOAMI_HARD_POOL = [
    { name: 'متوشالح', clue: 'اشتهر بأنه أطول شخص عمرا مذكور في الكتاب المقدس.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'أخنوخ', clue: 'سار مع الله ولم يوجد لأن الله أخذه إليه.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'ملك صادق', clue: 'كان ملك شاليم وكاهن الله العلي وبارك إبراهيم.', category: 'كاهن', difficulty: 'صعب' },
    { name: 'إسماعيل', clue: 'كان ابن إبراهيم من هاجر ووعد الله أن يجعل منه أمة عظيمة.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'عيسو', clue: 'كان أخا ليعقوب وباع بكوريته مقابل أكلة من العدس.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'بنيامين', clue: 'كان أصغر أبناء يعقوب وأخا شقيقا ليوسف.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'ناثان', clue: 'كان نبيا واجه داود بعد خطيته مع بثشبع بمثل الغني والفقير.', category: 'نبي', difficulty: 'صعب' },
    { name: 'حزقيا', clue: 'كان ملكا صالحا وصلى عندما حاصر سنحاريب أورشليم.', category: 'ملك', difficulty: 'صعب' },
    { name: 'يوشيا', clue: 'كان ملكا صغير السن وأصلح الهيكل واكتشفت في أيامه شريعة الرب.', category: 'ملك', difficulty: 'صعب' },
    { name: 'نحميا', clue: 'قاد إعادة بناء أسوار أورشليم رغم مقاومة أعدائه.', category: 'قائد', difficulty: 'صعب' },
    { name: 'عزرا', clue: 'كان كاهنا وكاتبا ماهرا في شريعة موسى وعاد إلى أورشليم.', category: 'كاهن', difficulty: 'صعب' },
    { name: 'زربابل', clue: 'قاد مجموعة من اليهود العائدين من السبي وأعاد بناء الهيكل.', category: 'قائد', difficulty: 'صعب' },
    { name: 'بلعام', clue: 'ذهب ليلعن إسرائيل لكن حماره رأى ملاك الرب قبله.', category: 'نبي', difficulty: 'صعب' },
    { name: 'بالاق', clue: 'كان ملك موآب وطلب من بلعام أن يلعن شعب إسرائيل.', category: 'ملك', difficulty: 'صعب' },
    { name: 'عخان', clue: 'أخذ أشياء محرمة من غنائم أريحا فتسبب في هزيمة إسرائيل.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'يفتاح', clue: 'كان أحد قضاة إسرائيل ونذر نذرا صعبا قبل خروجه للحرب.', category: 'قاضٍ', difficulty: 'صعب' },
    { name: 'شمجر', clue: 'كان قاضيا ضرب الفلسطينيين بمنساس بقر.', category: 'قاضٍ', difficulty: 'صعب' },
    { name: 'إهود', clue: 'كان قاضيا أعسر وقتل عجلون ملك موآب بخنجر.', category: 'قاضٍ', difficulty: 'صعب' },
    { name: 'باراق', clue: 'قاد جيش إسرائيل ضد سيسرا بتشجيع من النبية دبورة.', category: 'قائد', difficulty: 'صعب' },
    { name: 'سيسرا', clue: 'كان قائد جيش كنعاني هزم ثم قتلته امرأة تدعى ياعيل.', category: 'قائد', difficulty: 'صعب' },
    { name: 'ياعيل', clue: 'استقبلت سيسرا في خيمتها ثم قتلته أثناء نومه.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'أبيجايل', clue: 'كانت زوجة نابال ثم أصبحت زوجة داود وعرفت بالحكمة.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'أخيتوفل', clue: 'كان مشيرا لداود ثم انضم إلى أبشالوم وانتهت حياته بالانتحار.', category: 'مستشار', difficulty: 'صعب' },
    { name: 'أبشالوم', clue: 'كان ابن داود وتمرد على أبيه وحاول الاستيلاء على عرشه.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'يوآب', clue: 'كان قائد جيش داود وعرف بقوته وجرأته في الحروب.', category: 'قائد جيش', difficulty: 'صعب' },
    { name: 'ميخا', clue: 'تنبأ أن الحاكم الذي يخرج من بيت لحم سيكون من أصول قديمة.', category: 'نبي', difficulty: 'صعب' },
    { name: 'صفنيا', clue: 'تحدث عن يوم الرب ودعا الشعب إلى طلب الرب والتواضع.', category: 'نبي', difficulty: 'صعب' },
    { name: 'ناحوم', clue: 'تنبأ بسقوط نينوى وخرابها.', category: 'نبي', difficulty: 'صعب' },
    { name: 'حبقوق', clue: 'سأل الله لماذا يسمح بالظلم ثم أعلن أن البار بالإيمان يحيا.', category: 'نبي', difficulty: 'صعب' },
    { name: 'حجي', clue: 'شجع الشعب على إعادة بناء هيكل الرب بعد العودة من السبي.', category: 'نبي', difficulty: 'صعب' },
    { name: 'زكريا', clue: 'رأى رؤى عن أورشليم والهيكل والمسيا وشجع الشعب بعد السبي.', category: 'نبي', difficulty: 'صعب' },
    { name: 'أبولس', clue: 'كان رجلا فصيحا مقتدرا في الكتب وعلمه أكيلا وبريسكلا.', category: 'خادم', difficulty: 'صعب' },
    { name: 'أكيلا', clue: 'كان يعمل في صناعة الخيام واستضاف بولس مع زوجته بريسكلا.', category: 'خادم', difficulty: 'صعب' },
    { name: 'بريسكلا', clue: 'خدمت مع زوجها أكيلا وساعدت في تعليم أبولس طريق الله.', category: 'خادمة', difficulty: 'صعب' },
    { name: 'ليدية', clue: 'كانت بائعة أرجوان من ثياتيرا وآمنت بعد أن سمعت كرازة بولس.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'فيلبس السجان', clue: 'كان سجان في فيلبي وآمن بالمسيح مع أهل بيته بعد الزلزلة.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'ديماس', clue: 'كان يعمل مع بولس لفترة ثم تركه لأنه أحب العالم الحاضر.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'أنسيمس', clue: 'كان عبدا هاربا ثم صار مؤمنا وعاد إلى سيده بعد رسالة بولس.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'فليمون', clue: 'كان مؤمنا كتب إليه بولس رسالة بخصوص عبده الهارب أنسيمس.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'سيلا', clue: 'رافق بولس في الخدمة وظهر اسمه في سفر الأعمال.', category: 'خادم', difficulty: 'صعب' },
    { name: 'ياسون', clue: 'استضاف بولس ورفاقه في تسالونيكي وتعرض للمحاكمة بسببهم.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'غمالائيل', clue: 'كان معلما للناموس واحترمه الشعب ودافع عن الرسل أمام المجمع.', category: 'معلم ناموس', difficulty: 'صعب' },
    { name: 'حنانيا الدمشقي', clue: 'ذهب إلى شاول ووضع يديه عليه فعاد إليه بصره.', category: 'تلميذ', difficulty: 'صعب' },
    { name: 'سفيرا', clue: 'كذبت مع زوجها بشأن ثمن الحقل وسقطت ميتة بعد مواجهة بطرس.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'حنانيا', clue: 'باع أرضا وأخفى جزءا من المال وكذب على الرسل.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'كورنيليوس', clue: 'كان قائد مئة روماني صلى إلى الله وأصبح أول من الأمم يقبل الإنجيل.', category: 'شخصية كتابية', difficulty: 'صعب' },
    { name: 'أغريباس', clue: 'سمع دفاع بولس وقال إن بولس كاد يقنعه أن يصير مسيحيا.', category: 'ملك', difficulty: 'صعب' }
];

// ============================================================
//   Combined pool (all levels)
// ============================================================
const WHOAMI_DEFAULT_POOL = [
    ...WHOAMI_EASY_POOL,
    ...WHOAMI_MEDIUM_POOL,
    ...WHOAMI_HARD_POOL
];

// Map the select value (easy/medium/hard) to the Arabic level.
const WHOAMI_LEVEL_TO_ARABIC = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب'
};

export const whoamiGameMixin = {
    createWhoamiGamePool() {
        return WHOAMI_DEFAULT_POOL.slice();
    },

    getWhoamiDifficulty(difficulty) {
        const normalized = (difficulty || 'medium').toLowerCase().trim() || 'medium';
        return WHOAMI_LEVEL_TO_ARABIC[normalized] || 'متوسط';
    },

    buildWhoamiGamePool(difficulty = 'medium') {
        const sourcePool = this.whoamiGamePool && this.whoamiGamePool.length
            ? this.whoamiGamePool
            : this.createWhoamiGamePool();
        const targetLevel = this.getWhoamiDifficulty(difficulty);
        const filtered = sourcePool.filter(person => person.difficulty === targetLevel);
        return filtered.length > 0 ? filtered : sourcePool;
    },

    pickWhoamiPerson() {
        const select = document.getElementById('whoami-difficulty-select');
        const difficulty = (select && select.value) || 'medium';
        const pool = this.buildWhoamiGamePool(difficulty);
        if (!pool.length) return null;

        if (!this.whoamiUsedPersons) this.whoamiUsedPersons = new Set();
        const available = pool.filter(person => !this.whoamiUsedPersons.has(person.name));
        const eligible = available.length > 0 ? available : pool;

        // Once every person in this level has been shown, start a new cycle.
        if (available.length === 0) this.whoamiUsedPersons.clear();

        const person = eligible[Math.floor(Math.random() * eligible.length)];
        this.whoamiUsedPersons.add(person.name);
        this.whoamiGameState.poolSize = pool.length;
        return person;
    },

    persistWhoamiGamePreferences() {
        const difficultySelect = document.getElementById('whoami-difficulty-select');
        if (difficultySelect) {
            localStorage.setItem(this.whoamiGameDifficultyKey, difficultySelect.value);
        }
    },

    loadWhoamiGamePreferences() {
        const savedDifficulty = localStorage.getItem(this.whoamiGameDifficultyKey) || 'medium';
        const difficultySelect = document.getElementById('whoami-difficulty-select');
        if (difficultySelect) difficultySelect.value = savedDifficulty;
        if (this.whoamiGameState) this.whoamiGameState.difficulty = savedDifficulty;
    },

    setWhoamiGradeButtons(enabled) {
        const knewBtn = document.getElementById('whoami-knew-btn');
        const didntBtn = document.getElementById('whoami-didnt-btn');
        if (knewBtn) knewBtn.disabled = !enabled;
        if (didntBtn) didntBtn.disabled = !enabled;
    },

    resetWhoamiFlip() {
        const card = document.getElementById('whoami-flip-card');
        if (card) {
            card.classList.remove('flipped');
            card.removeAttribute('aria-pressed');
        }
        if (this.whoamiGameState) {
            this.whoamiGameState.revealed = false;
            this.whoamiGameState.graded = false;
        }
        this.setWhoamiGradeButtons(false);
    },

    gradeWhoamiCard(knew) {
        if (!this.whoamiGameState || !this.whoamiGameState.person) return;
        if (!this.whoamiGameState.revealed || this.whoamiGameState.graded) return;

        this.whoamiGameState.graded = true;
        if (knew) this.whoamiGameState.knewCount += 1;
        else this.whoamiGameState.didntCount += 1;

        this.updateWhoamiCounters();
        this.setWhoamiGradeButtons(false);

        const statusEl = document.getElementById('whoami-game-status');
        const nextBtn = document.getElementById('whoami-next-btn');
        if (statusEl) {
            statusEl.textContent = knew
                ? 'أحسنت! احتسبت هذه الشخصية ضمن من عرفتهم.'
                : 'لا بأس، ستتعرف عليها في المرة القادمة.';
        }
        if (nextBtn) nextBtn.disabled = false;
    },

    updateWhoamiCounters() {
        const st = this.whoamiGameState;
        const countEl = document.getElementById('whoami-game-count');
        const knewEl = document.getElementById('whoami-game-knew');
        const didntEl = document.getElementById('whoami-game-didnt');
        const scoreEl = document.getElementById('whoami-game-score');

        const answered = st.knewCount + st.didntCount;
        const score = answered ? Math.round((st.knewCount / answered) * 100) : 0;

        if (countEl) countEl.textContent = String(st.seenCount);
        if (knewEl) knewEl.textContent = String(st.knewCount);
        if (didntEl) didntEl.textContent = String(st.didntCount);
        if (scoreEl) scoreEl.textContent = `${score}%`;
    },

    startWhoamiGame() {
        if (!this.whoamiGameState) this.whoamiGameState = {};
        this.whoamiGameState.seenCount = 0;
        this.whoamiGameState.knewCount = 0;
        this.whoamiGameState.didntCount = 0;
        this.whoamiGameState.graded = false;
        if (this.whoamiUsedPersons) this.whoamiUsedPersons.clear();
        this.setWhoamiGradeButtons(false);
        this.updateWhoamiCounters();
        this.nextWhoamiCard();
    },

    nextWhoamiCard() {
        if (this.whoamiNextTimer) {
            clearTimeout(this.whoamiNextTimer);
            this.whoamiNextTimer = null;
        }

        const person = this.pickWhoamiPerson();
        if (!person) return;

        this.whoamiGameState.person = person;
        this.whoamiGameState.seenCount += 1;
        this.updateWhoamiCounters();

        const nextBtn = document.getElementById('whoami-next-btn');
        if (nextBtn) nextBtn.disabled = true;

        // If the card is showing the previous answer, flip it back to the clue
        // first and wait for the animation to finish before swapping in the new
        // content — otherwise the next answer flashes on the back mid-flip.
        const card = document.getElementById('whoami-flip-card');
        const wasFlipped = card && card.classList.contains('flipped');
        this.resetWhoamiFlip();

        if (wasFlipped) {
            this.whoamiNextTimer = setTimeout(() => {
                this.whoamiNextTimer = null;
                this.loadWhoamiCardContent();
            }, 600);
        } else {
            this.loadWhoamiCardContent();
        }
    },

    loadWhoamiCardContent() {
        const person = this.whoamiGameState.person;
        if (!person) return;

        const clueEl = document.getElementById('whoami-game-clue-text');
        const answerEl = document.getElementById('whoami-game-answer');
        const categoryEl = document.getElementById('whoami-game-category');
        const statusEl = document.getElementById('whoami-game-status');

        if (clueEl) clueEl.textContent = person.clue;
        if (answerEl) answerEl.textContent = person.name;
        if (categoryEl) categoryEl.textContent = person.category;
        if (statusEl) statusEl.textContent = 'اقرأ التلميح وقلّب البطاقة، ثم حدد: هل عرفتها؟';
    },

    flipWhoamiCard() {
        if (!this.whoamiGameState || !this.whoamiGameState.person) return;

        const card = document.getElementById('whoami-flip-card');
        if (!card) return;

        card.classList.toggle('flipped');
        const flipped = card.classList.contains('flipped');
        this.whoamiGameState.revealed = flipped;

        const statusEl = document.getElementById('whoami-game-status');
        if (flipped) {
            card.setAttribute('aria-pressed', 'true');
            if (statusEl) statusEl.textContent = `الشخصية هي: ${this.whoamiGameState.person.name} — هل عرفتها؟ اختر من الأسفل.`;
            this.setWhoamiGradeButtons(true);
        } else {
            card.removeAttribute('aria-pressed');
            if (statusEl) statusEl.textContent = 'اقرأ التلميح وقلّب البطاقة، ثم حدد: هل عرفتها؟';
            this.setWhoamiGradeButtons(false);
        }
    }
};
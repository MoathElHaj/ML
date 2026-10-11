-- Bariq's four core services (Arabic + English). Run after the migrations; safe to run more than once.
insert into public.services (slug, title, summary, description, icon, image_url, features, sort_order, title_en, summary_en, description_en, features_en)
values
  (
    'digital-marketing',
    'التسويق الرقمي',
    'حملات مدروسة على منصات التواصل ومحركات البحث تحوّل المتابعين إلى عملاء.',
    'نبني لعلامتك استراتيجية تسويق رقمي متكاملة تبدأ بفهم جمهورك ومنافسيك، ثم ندير حساباتك وحملاتك الإعلانية ونقيس النتائج باستمرار حتى يتحول كل ريال تنفقه إلى نمو حقيقي.',
    'megaphone',
    '/images/service-marketing.jpg',
    array['إدارة حسابات التواصل الاجتماعي', 'الإعلانات الممولة على Meta وGoogle وTikTok وSnapchat', 'تحسين الظهور في محركات البحث SEO', 'صناعة المحتوى وتقارير أداء شهرية'],
    1,
    'Digital Marketing',
    'Well-planned campaigns on social media and search engines that turn followers into customers.',
    'We build a complete digital marketing strategy for your brand, starting with your audience and competitors. Then we run your accounts and ad campaigns and measure results continuously, so every rial you spend turns into real growth.',
    array['Social media account management', 'Paid ads on Meta, Google, TikTok and Snapchat', 'Search engine optimization (SEO)', 'Content creation and monthly performance reports']
  ),
  (
    'graphic-design',
    'تصميم الجرافيك',
    'هويات بصرية وتصاميم تلفت الانتباه وتبقى في الذاكرة.',
    'نصمم هوية بصرية تعبّر عن شخصيتك من الشعار حتى أصغر تفصيلة، ونحوّل رسائلك إلى تصاميم واضحة وجذابة لكل منصة: من منشورات التواصل إلى المطبوعات والعروض التقديمية.',
    'palette',
    '/images/service-design.jpg',
    array['تصميم الشعارات والهويات البصرية', 'تصاميم منصات التواصل الاجتماعي', 'المطبوعات والعروض التقديمية', 'الموشن جرافيك والفيديو القصير'],
    2,
    'Graphic Design',
    'Brand identities and designs that catch the eye and stay memorable.',
    'We design a visual identity that expresses who you are, from the logo down to the smallest detail, and turn your messages into clear, attractive designs for every channel: from social posts to print and presentations.',
    array['Logo and brand identity design', 'Social media designs', 'Print and presentations', 'Motion graphics and short videos']
  ),
  (
    'web-development',
    'تطوير المواقع',
    'مواقع ومتاجر سريعة وآمنة، مصممة لتحويل الزوار إلى عملاء.',
    'نطوّر مواقع تعريفية ومتاجر إلكترونية وأنظمة مخصصة بأحدث التقنيات، بتصميم متجاوب مع كل الشاشات وسرعة تحميل عالية وتجربة استخدام مدروسة، مع لوحة تحكم تديرون منها المحتوى بسهولة.',
    'monitor-smartphone',
    '/images/service-web.jpg',
    array['مواقع الشركات والمواقع التعريفية', 'المتاجر الإلكترونية وبوابات الدفع', 'لوحات التحكم والأنظمة المخصصة', 'تحسين السرعة وتجربة المستخدم'],
    3,
    'Web Development',
    'Fast, secure websites and online stores designed to turn visitors into customers.',
    'We build company websites, online stores and custom systems with modern technology: responsive on every screen, fast to load, thoughtfully designed, and with a dashboard that makes managing your content easy.',
    array['Company and brochure websites', 'Online stores and payment gateways', 'Dashboards and custom systems', 'Speed and user-experience optimization']
  ),
  (
    'mobile-development',
    'تطوير تطبيقات الموبايل',
    'تطبيقات iOS وAndroid بتجربة سلسة تضع خدماتك في جيب عملائك.',
    'نصمم ونطوّر تطبيقات جوال أصلية ومتعددة المنصات، من دراسة الفكرة وتصميم الواجهات حتى النشر على المتاجر والدعم المستمر، مع ربط كامل بأنظمتك وبوابات الدفع.',
    'smartphone',
    '/images/service-mobile.jpg',
    array['تطبيقات iOS وAndroid', 'تصميم واجهات وتجربة المستخدم UI/UX', 'الربط مع الأنظمة وبوابات الدفع', 'النشر على المتاجر والدعم الفني'],
    4,
    'Mobile App Development',
    'iOS and Android apps with a smooth experience that puts your services in your customers'' pockets.',
    'We design and build native and cross-platform mobile apps, from shaping the idea and designing the interface to publishing on the app stores and ongoing support, fully connected to your systems and payment gateways.',
    array['iOS and Android apps', 'UI/UX design', 'System and payment integrations', 'App store publishing and support']
  )
on conflict (slug) do nothing;

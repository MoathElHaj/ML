-- English versions of site content. Arabic stays the primary (required) language;
-- English columns are optional and the site falls back to Arabic when they're empty.

alter table public.services
  add column if not exists title_en text,
  add column if not exists summary_en text,
  add column if not exists description_en text,
  add column if not exists features_en text[] not null default '{}';

alter table public.projects
  add column if not exists title_en text,
  add column if not exists summary_en text,
  add column if not exists description_en text,
  add column if not exists tags_en text[] not null default '{}';

alter table public.posts
  add column if not exists title_en text,
  add column if not exists excerpt_en text,
  add column if not exists content_en text,
  add column if not exists category_en text;

-- English copy for the four core services (only fills empty fields).
update public.services set
  title_en = coalesce(title_en, 'Digital Marketing'),
  summary_en = coalesce(summary_en, 'Well-planned campaigns on social media and search engines that turn followers into customers.'),
  description_en = coalesce(description_en, 'We build a complete digital marketing strategy for your brand, starting with your audience and competitors. Then we run your accounts and ad campaigns and measure results continuously, so every rial you spend turns into real growth.'),
  features_en = case when cardinality(features_en) = 0 then array['Social media account management', 'Paid ads on Meta, Google, TikTok and Snapchat', 'Search engine optimization (SEO)', 'Content creation and monthly performance reports'] else features_en end
where slug = 'digital-marketing';

update public.services set
  title_en = coalesce(title_en, 'Graphic Design'),
  summary_en = coalesce(summary_en, 'Brand identities and designs that catch the eye and stay memorable.'),
  description_en = coalesce(description_en, 'We design a visual identity that expresses who you are, from the logo down to the smallest detail, and turn your messages into clear, attractive designs for every channel: from social posts to print and presentations.'),
  features_en = case when cardinality(features_en) = 0 then array['Logo and brand identity design', 'Social media designs', 'Print and presentations', 'Motion graphics and short videos'] else features_en end
where slug = 'graphic-design';

update public.services set
  title_en = coalesce(title_en, 'Web Development'),
  summary_en = coalesce(summary_en, 'Fast, secure websites and online stores designed to turn visitors into customers.'),
  description_en = coalesce(description_en, 'We build company websites, online stores and custom systems with modern technology: responsive on every screen, fast to load, thoughtfully designed, and with a dashboard that makes managing your content easy.'),
  features_en = case when cardinality(features_en) = 0 then array['Company and brochure websites', 'Online stores and payment gateways', 'Dashboards and custom systems', 'Speed and user-experience optimization'] else features_en end
where slug = 'web-development';

update public.services set
  title_en = coalesce(title_en, 'Mobile App Development'),
  summary_en = coalesce(summary_en, 'iOS and Android apps with a smooth experience that puts your services in your customers'' pockets.'),
  description_en = coalesce(description_en, 'We design and build native and cross-platform mobile apps, from shaping the idea and designing the interface to publishing on the app stores and ongoing support, fully connected to your systems and payment gateways.'),
  features_en = case when cardinality(features_en) = 0 then array['iOS and Android apps', 'UI/UX design', 'System and payment integrations', 'App store publishing and support'] else features_en end
where slug = 'mobile-development';

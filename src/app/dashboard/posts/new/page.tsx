import { PageHeader } from "@/components/dashboard/ui";
import { PostForm } from "@/components/dashboard/forms";

export const metadata = { title: "مقال جديد" };

export default function NewPost() {
  return (
    <>
      <PageHeader title="مقال جديد" />
      <PostForm />
    </>
  );
}

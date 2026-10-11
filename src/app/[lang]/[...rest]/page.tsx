import { notFound } from "next/navigation";

/** Unknown paths inside the site render the localized 404 within the site layout. */
export default function CatchAll() {
  notFound();
}

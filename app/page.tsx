import { ProductDemo } from "@/components/product-demo";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const moduleParam = typeof params.module === "string" ? params.module : "home";
  return <ProductDemo initialModule={moduleParam} />;
}

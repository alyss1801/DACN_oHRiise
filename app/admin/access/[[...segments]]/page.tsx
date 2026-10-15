import { ProductDemo } from "@/components/product-demo";

export default async function AccessPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments = ["users"] } = await params;
  return <ProductDemo initialModule={`access/${segments.join("/")}`} />;
}

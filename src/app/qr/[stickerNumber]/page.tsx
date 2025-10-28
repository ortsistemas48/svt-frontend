
export default async function QrPage({ params }: { params: Promise<{ stickerNumber: string }> }) {
  const { stickerNumber } = await params;
  return <div>QrPage</div>;
}

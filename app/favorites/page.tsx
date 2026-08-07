import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import FavoritesList from "@/components/FavoritesList";

export default function FavoritesPage() {
  return (
    <>
      <TopBar title="Kegemaran" backHref="/" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <FavoritesList />
        <Footer />
      </main>
    </>
  );
}

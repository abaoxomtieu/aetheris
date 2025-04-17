import { CareerRoles } from "@/components/CareerRoles";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CareerRolesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8">
          <CareerRoles />
        </div>
      </main>
      <Footer />
    </div>
  );
}
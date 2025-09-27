import TravelHeader from "@/components/TravelHeader";
import HeroSection from "@/components/HeroSection";
import FeaturedDeals from "@/components/FeaturedDeals";
import PopularActivities from "@/components/PopularActivities";
import FeaturesSection from "@/components/FeaturesSection";
import TopDestinations from "@/components/TopDestinations";
import AppDownload from "@/components/AppDownload";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      <HeroSection />
      <FeaturedDeals />
      <PopularActivities />
      <FeaturesSection />
      <TopDestinations />
      <AppDownload />
      <Footer />
    </div>
  );
};

export default Index;

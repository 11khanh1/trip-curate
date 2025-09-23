import TravelHeader from "@/components/TravelHeader";
import HeroSection from "@/components/HeroSection";
import FeaturedDeals from "@/components/FeaturedDeals";
import PopularActivities from "@/components/PopularActivities";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      <HeroSection />
      <FeaturedDeals />
      <PopularActivities />
    </div>
  );
};

export default Index;

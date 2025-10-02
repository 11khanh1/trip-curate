import { Star, MapPin, Clock, Users, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface TourCardProps {
  id: string;
  title: string;
  location: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  duration: string;
  category: string;
  isPopular?: boolean;
  features: string[];
}

const TourCard = ({ 
  id,
  title, 
  location, 
  image, 
  rating, 
  reviewCount, 
  price, 
  originalPrice, 
  discount, 
  duration, 
  category,
  isPopular,
  features 
}: TourCardProps) => {
  return (
    <Link to={`/activity/${id}`}>
      <Card className="overflow-hidden hover:shadow-hover transition-all duration-300 group cursor-pointer">
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          {isPopular && (
            <Badge className="bg-gradient-orange text-white border-0">
              Phổ biến
            </Badge>
          )}
          {discount && (
            <Badge variant="destructive" className="ml-2">
              Giảm {discount}%
            </Badge>
          )}
        </div>
        <Button
          variant="ghost" 
          size="icon"
          className="absolute top-3 right-3 bg-white/80 hover:bg-white"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{category} • {location}</span>
          </div>
          
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{duration}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {features.slice(0, 3).map((feature, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm">{rating}</span>
            <span className="text-sm text-muted-foreground">({reviewCount.toLocaleString()})</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{(Math.random() * 100 + 10).toFixed(0)}K+ Đã đặt</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₫ {originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">Từ</span>
              <span className="text-lg font-bold text-primary ml-1">
                ₫ {price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default TourCard;
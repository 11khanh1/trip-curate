const TopDestinations = () => {
  const destinations = [
    { name: "Vịnh Hạ Long", rank: 1 },
    { name: "Địa đạo Củ Chi", rank: 2 },
    { name: "Sun World Bà Nà Hills", rank: 3 },
    { name: "Di sản Tràng An - Ninh Bình", rank: 4 },
    { name: "Phan Xi Păng", rank: 5 },
    { name: "Sun World Fansipan Legend", rank: 6 },
    { name: "Vịnh Lan Hạ", rank: 7 },
    { name: "Cát Cát", rank: 8 },
    { name: "Sông Sài Gòn", rank: 9 },
    { name: "Đồng bằng sông Cửu Long", rank: 10 },
    { name: "Cầu Rồng", rank: 11 },
    { name: "Phố đường tàu Hà Nội", rank: 12 }
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
          Hấp dẫn không kém
        </h2>
        <h3 className="text-xl text-center mb-12 text-muted-foreground">
          Điểm tham quan hàng đầu Việt Nam
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {destinations.map((destination) => (
            <div 
              key={destination.rank}
              className="bg-card rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer border"
            >
              <div className="flex items-center space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  {destination.rank}
                </span>
                <span className="text-foreground font-medium text-sm">
                  {destination.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopDestinations;
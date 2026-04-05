import Image from "next/image";

export default function FeaturesSection() {
  const features = [
    {
      title: "Safe Exchange Process",
      description: "Secure and hassle-free exchange process.",
      icon: "/m1.png",
    },
    {
      title: "Fast Delivery",
      description: "Receive your order faster than ever before!",
      icon: "/m2.png",
    },
    {
      title: "Quality Products",
      description: "Presented in an elegant jewelry, perfect for gift.",
      icon: "/m3.png",
    },
    {
      title: "Secure Packaging",
      description: "Carefully packed to ensure safe and damage-free delivery.",
      icon: "/m4.webp", // add your new icon
    },
  ];

  return (
    <section className="w-full bg-back py-12">
      <div className="px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-10">
          
          {features.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center px-2"
            >
              {/* Icon */}
              <div className="mb-4 h-24 flex items-end justify-center">
                <Image
                  src={item.icon}
                  alt={item.title}
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </div>

              {/* Title */}
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm md:text-base leading-snug max-w-sm">
                {item.description}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
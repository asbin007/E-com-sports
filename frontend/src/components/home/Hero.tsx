import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star, Zap, Shield, ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonsRef = useRef(null);
  const trustRef = useRef(null);
  const imgContainerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(titleRef.current, {
        y: 100,
        opacity: 0,
        skewY: 7,
        duration: 1.5,
      })
        .from(
          subtitleRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 1,
          },
          "-=1",
        )
        .from(
          buttonsRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.8",
        )
        .from(
          trustRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
          },
          "-=0.6",
        )
        .from(
          imgContainerRef.current,
          {
            scale: 0.8,
            rotate: 10,
            opacity: 0,
            duration: 1.5,
            ease: "back.out(1.7)",
          },
          "-=1.5",
        );

      // Floating animation for the hero image
      gsap.to(".floating-img", {
        y: -15,
        duration: 2,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
      });

      // Scale in background elements
      gsap.from(".bg-element", {
        scale: 0,
        opacity: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: "elastic.out(1, 0.3)",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen bg-stone-950 flex items-center pt-20 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-element absolute top-1/4 left-10 w-32 h-32 bg-orange-600 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div
          className="bg-element absolute bottom-1/4 right-10 w-48 h-48 bg-white rounded-full opacity-5 blur-3xl"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="bg-element absolute top-1/2 left-1/2 w-40 h-40 bg-orange-600 rounded-full opacity-5 blur-3xl animate-bounce"
          style={{ animationDelay: "1.5s" }}
        ></div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Text Content */}
          <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-500 font-black text-xs uppercase tracking-[0.2em] mb-6">
                <span className="w-2 h-2 bg-orange-600 rounded-full animate-ping"></span>
                NEW SPORTS COLLECTION 2026
              </div>

              <h1
                ref={titleRef}
                className="text-6xl sm:text-7xl md:text-8xl font-black leading-none text-white tracking-tighter uppercase italic"
              >
                Step Into <br />
                <span className="text-orange-600">Greatness</span>
              </h1>

              <p
                ref={subtitleRef}
                className="text-lg md:text-xl text-gray-400 max-w-lg mt-6 leading-relaxed mx-auto lg:mx-0 font-medium"
              >
                Premium quality sports footwear engineered for maximum
                performance, comfort & style. Trusted by 15k+ athletes across
                Nepal.
              </p>

              {/* Action Buttons */}
              <div
                ref={buttonsRef}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-8"
              >
                <button
                  onClick={() => navigate("/shop")}
                  className="group relative bg-orange-600 text-stone-950 px-10 py-5 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-orange-500 transition-all hover:scale-105 shadow-[0_0_30px_rgba(234,88,12,0.4)] active:scale-95 overflow-hidden"
                >
                  <span className="relative z-10">Shop Now</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>

                <button className="px-10 py-5 bg-stone-900 text-white border border-white/10 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-stone-800 transition-all hover:scale-105 active:scale-95">
                  <Play className="w-5 h-5 fill-current text-white" />
                  <span>Watch Promo</span>
                </button>
              </div>

              {/* Trust badges */}
              <div
                ref={trustRef}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-8 mt-12 pt-8 border-t border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-orange-600 border border-white/5">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">
                      Genuine
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">
                      100% Authentic
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-orange-600 border border-white/5">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">
                      Fast
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">
                      2-3 Day delivery
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex text-orange-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">
                      4.9/5
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">
                      From 10k reviews
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="lg:w-1/2 relative w-full flex justify-center mt-10 lg:mt-0">
            <div
              ref={imgContainerRef}
              className="relative w-full max-w-md md:max-w-lg aspect-square"
            >
              <div className="absolute inset-0 bg-orange-600/20 rounded-full blur-3xl"></div>
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format"
                alt="Nike Red Shoe"
                className="floating-img relative z-10 w-full h-full object-contain filter drop-shadow-[0_30px_60px_rgba(234,88,12,0.3)] transition-transform duration-700 hover:scale-105 cursor-pointer"
              />

              {/* Floating badges */}
              <div
                className="absolute top-10 -right-4 bg-stone-900 border border-white/10 p-5 rounded-2xl shadow-2xl z-20 animate-bounce"
                style={{ animationDuration: "3s" }}
              >
                <p className="text-orange-600 font-black text-2xl italic tracking-tighter">
                  Rs 5,500
                </p>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                  Summer Offer
                </p>
              </div>

              <div className="absolute -bottom-4 left-10 bg-stone-900 border border-white/10 p-5 rounded-2xl shadow-2xl z-20 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600/10 rounded-lg flex items-center justify-center text-orange-600">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase italic">
                    Air Zoom
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                    Propulsion tech
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

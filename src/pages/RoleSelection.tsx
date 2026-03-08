import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Dumbbell, Crown, Users, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import gymOwnerImg from "@/assets/gym-owner.png";
import gymStaffImg from "@/assets/gym-staff.png";

type SelectedRole = "owner" | "staff";

const roles: { id: SelectedRole; title: string; desc: string; img: string; icon: typeof Crown }[] = [
  {
    id: "owner",
    title: "Gym Owner",
    desc: "Manage your gym • full admin access",
    img: gymOwnerImg,
    icon: Crown,
  },
  {
    id: "staff",
    title: "Gym Staff",
    desc: "Trainer / Reception • limited access",
    img: gymStaffImg,
    icon: Users,
  },
];

const RoleSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelectedRole | null>(null);
  const [hovering, setHovering] = useState<SelectedRole | null>(null);

  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleContinue = () => {
    if (selected) {
      navigate(`/auth?role=${selected}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg animate-fade-in space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Dumbbell className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">Welcome to GymFlow</h1>
          <p className="text-muted-foreground text-center text-sm max-w-xs">
            Choose who you are so we can give you the right features
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4">
          {roles.map((role) => {
            const isSelected = selected === role.id;
            const isHovering = hovering === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                onMouseEnter={() => setHovering(role.id)}
                onMouseLeave={() => setHovering(null)}
                className={`
                  relative flex items-center gap-5 rounded-2xl border-2 p-5 text-left transition-all duration-300 ease-out
                  ${isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                  }
                  ${isHovering && !isSelected ? "scale-[1.01]" : ""}
                  active:scale-[0.99]
                `}
              >
                {/* Selection indicator */}
                <div className={`
                  absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all duration-200
                  flex items-center justify-center
                  ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}
                `}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Image */}
                <div className={`
                  w-20 h-20 rounded-xl overflow-hidden shrink-0 transition-all duration-300
                  ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                `}>
                  <img
                    src={role.img}
                    alt={role.title}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <role.icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`font-semibold font-display text-lg ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {role.title}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`
            w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 font-semibold text-base transition-all duration-300
            ${selected
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;

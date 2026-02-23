import { render, screen } from "@testing-library/react";
import { HomeContracts } from "@/components/HomeContracts";

jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe("HomeContracts", () => {
  it("affiche la liste des contrats", () => {
    render(
      <HomeContracts
        initialContracts={[
          {
            id: "c1",
            childName: "Lina",
            startDate: new Date("2026-01-01"),
            endDate: null,
            contractType: "CDI",
            hoursPerDay: 8.5,
            daysPerWeek: 4,
            weeksPerYear: 46,
            plannedAbsences: [],
            baseHourlyRate: 4.2,
            allowOverride: false,
            overrideHourlyRate: null,
            billComplementaryHours: true,
            overtimeRatePercent: 10,
            mealFeeEnabled: true,
            mealFeePerMeal: 3,
            defaultMealsPerDay: 1,
            maintenanceFeeEnabled: false,
            maintenanceFeeTiers: [],
            applyPrecariousnessPrime: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]}
      />,
    );
    expect(screen.getByText("Contrats")).toBeInTheDocument();
    expect(screen.getByText("Lina")).toBeInTheDocument();
    expect(screen.getByText(/4 j\/sem/)).toBeInTheDocument();
  });
});

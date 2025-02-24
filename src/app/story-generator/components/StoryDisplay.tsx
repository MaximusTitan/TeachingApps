import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LessonPlan } from "./types";

interface LessonPlanDisplayProps {
  plan: LessonPlan;
}

export default function LessonPlanDisplay({ plan }: LessonPlanDisplayProps) {
  return (
    <Card className="shadow-md border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-rose-500 flex justify-between items-start">
          <span>{plan.title}</span>
          <div className="text-sm font-normal text-gray-500 text-right">
            <p>Created by: {plan.metadata.createdBy}</p>
            <p>Date: {plan.metadata.createdAt}</p>
            <p>
              {plan.metadata.subject} - Grade {plan.metadata.grade}
            </p>
            <p>
              {plan.metadata.country} - {plan.metadata.board}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">Learning Objectives</h3>
          <ul className="list-disc pl-6 space-y-1">
            {plan.objectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Activities</h3>
          <ul className="list-disc pl-6 space-y-1">
            {plan.activities.map((activity, index) => (
              <li key={index}>{activity}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Assessment</h3>
          <ul className="list-disc pl-6 space-y-1">
            {plan.assessment.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Materials Needed</h3>
          <ul className="list-disc pl-6 space-y-1">
            {plan.materials.map((material, index) => (
              <li key={index}>{material}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Timeframe</h3>
          <p>{plan.timeframe}</p>
        </div>
      </CardContent>
    </Card>
  );
}
import { type LucideIcon } from "lucide-react";

export const FormSection = ({
  title,
  children,
  description,
  Icon = null,
  Details = null,
}: {
  title: string;
  children: React.ReactNode;
  description?: string;
  Icon?: LucideIcon | null;
  Details?: React.ReactNode | null;
}) => {
  return (
    <div className="flex w-full flex-col rounded-lg border border-gray-300 p-6">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h5 className="text-left text-sm font-medium text-gray-900 md:text-base">
            {Icon && (
              <Icon className="mr-2 inline-block h-4 w-4 text-blue-500" />
            )}
            {title}
          </h5>
          {description && (
            <span className="block text-sm text-gray-500">{description}</span>
          )}
        </div>
        {Details && Details}
      </div>
      <div className="mt-4 flex flex-col gap-2">{children}</div>
    </div>
  );
};

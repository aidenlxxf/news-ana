import type { NewsEntity } from "@na/schema";
import { Building, Calendar, MapPin, Package, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EntityListProps {
  entities: NewsEntity[];
}

function getEntityIcon(type: NewsEntity["type"]) {
  switch (type) {
    case "PERSON":
      return <User className="h-3 w-3" />;
    case "ORGANIZATION":
      return <Building className="h-3 w-3" />;
    case "LOCATION":
      return <MapPin className="h-3 w-3" />;
    case "PRODUCT":
      return <Package className="h-3 w-3" />;
    case "EVENT":
      return <Calendar className="h-3 w-3" />;
    default:
      return <User className="h-3 w-3" />;
  }
}

function getEntityColor(type: NewsEntity["type"]): string {
  switch (type) {
    case "PERSON":
      return "bg-blue-100 text-blue-800";
    case "ORGANIZATION":
      return "bg-green-100 text-green-800";
    case "LOCATION":
      return "bg-purple-100 text-purple-800";
    case "PRODUCT":
      return "bg-orange-100 text-orange-800";
    case "EVENT":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getEntityTypeLabel(type: NewsEntity["type"]): string {
  switch (type) {
    case "PERSON":
      return "Person";
    case "ORGANIZATION":
      return "Organization";
    case "LOCATION":
      return "Location";
    case "PRODUCT":
      return "Product";
    case "EVENT":
      return "Event";
    default:
      return "Other";
  }
}

export default function EntityList({ entities }: EntityListProps) {
  if (entities.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">No entities identified</p>
      </div>
    );
  }

  // Group entities by type
  const groupedEntities = entities.reduce(
    (acc, entity) => {
      if (!acc[entity.type]) {
        acc[entity.type] = [];
      }
      acc[entity.type].push(entity);
      return acc;
    },
    {} as Record<NewsEntity["type"], NewsEntity[]>,
  );

  return (
    <div className="space-y-4">
      {Object.entries(groupedEntities).map(([type, entityList]) => (
        <div key={type} className="space-y-2">
          {/* Type title */}
          <div className="flex items-center gap-2">
            {getEntityIcon(type as NewsEntity["type"])}
            <h4 className="font-medium text-gray-900">
              {getEntityTypeLabel(type as NewsEntity["type"])}
            </h4>
            <span className="text-xs text-gray-500">({entityList.length})</span>
          </div>

          {/* Entity list */}
          <div className="flex flex-wrap gap-2">
            {entityList.map((entity, index) => (
              <Badge
                key={`${entity.name}-${index}`}
                className={`${getEntityColor(entity.type)} flex items-center gap-1`}
              >
                {getEntityIcon(entity.type)}
                {entity.name}
              </Badge>
            ))}
          </div>
        </div>
      ))}

      {/* Statistics */}
      <div className="bg-gray-50 rounded-lg p-3 mt-4">
        <p className="text-xs text-gray-600">
          {entities.length} entities identified, covering{" "}
          {Object.keys(groupedEntities).length} types
        </p>
      </div>
    </div>
  );
}

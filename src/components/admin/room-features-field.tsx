import { FeatureIcon } from "@/components/rooms/feature-icon";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import type { FeatureSummary } from "@/domain/room";

type RoomFeaturesFieldProps = {
  features: FeatureSummary[];
  value: string[];
  onValueChange: (slugs: string[]) => void;
  errors?: { message: string }[];
};

export function RoomFeaturesField({
  features,
  value,
  onValueChange,
  errors,
}: RoomFeaturesFieldProps) {
  function toggle(slug: string, checked: boolean) {
    onValueChange(
      checked ? [...value, slug] : value.filter((item) => item !== slug),
    );
  }

  return (
    <FieldSet>
      <FieldLegend variant="label">Recursos</FieldLegend>
      <FieldGroup data-slot="checkbox-group" className="sm:grid sm:grid-cols-2">
        {features.map((feature) => (
          <Field key={feature.slug} orientation="horizontal">
            <Checkbox
              id={`feature-${feature.slug}`}
              name="features"
              value={feature.slug}
              checked={value.includes(feature.slug)}
              onCheckedChange={(checked) =>
                toggle(feature.slug, checked === true)
              }
            />
            <FieldLabel
              htmlFor={`feature-${feature.slug}`}
              className="font-normal [&>svg]:size-4 [&>svg]:text-muted-foreground"
            >
              <FeatureIcon slug={feature.slug} />
              {feature.name}
            </FieldLabel>
          </Field>
        ))}
      </FieldGroup>
      <FieldError errors={errors} />
    </FieldSet>
  );
}

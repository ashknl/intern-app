import { useState } from "react";
import { PlusCircle, UserPlus } from "lucide-react";
import ExcelImportCard from "@/components/ExcelImportCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const BRANCH_OPTIONS = [
  "CSE",
  "MECH",
  "CHE",
  "EE",
  "EEE",
  "ECE",
  "BIOTECH",
  "MINING",
  "FOOD",
  "METALLURGY",
  "CERAMIC",
];

const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th"];

const SECTION_OPTIONS = ["ITC", "HRD", "UNIT-1", "UNIT-2", "UNIT-3", "UNIT-4"];

const GENDER_OPTIONS = ["Male", "Female", "Other"];

interface ManualFormData {
  name: string;
  gender: string;
  identification_mark: string;
  institution_roll: string;
  degree: string;
  branch: string;
  year_of_study: string;
  guardian_name: string;
  guardian_relation: string;
  institution_name: string;
  res_c_o: string;
  res_p_o: string;
  res_pin: string;
  res_contact: string;
  cur_c_o: string;
  cur_p_o: string;
  cur_pin: string;
  cur_contact: string;
  starting_date: string;
  no_of_days: string;
  section_posted: string;
}

const EMPTY_FORM: ManualFormData = {
  name: "",
  gender: "",
  identification_mark: "",
  institution_roll: "",
  degree: "",
  branch: "",
  year_of_study: "",
  guardian_name: "",
  guardian_relation: "",
  institution_name: "",
  res_c_o: "",
  res_p_o: "",
  res_pin: "",
  res_contact: "",
  cur_c_o: "",
  cur_p_o: "",
  cur_pin: "",
  cur_contact: "",
  starting_date: "",
  no_of_days: "",
  section_posted: "",
};

function generateRegId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let rand = "";
  for (let i = 0; i < 6; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `REG-${y}${m}${d}-${rand}`;
}

export default function AddData() {
  const [formData, setFormData] = useState<ManualFormData>({ ...EMPTY_FORM });
  const [sameAddress, setSameAddress] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const handleChange = (field: keyof ManualFormData, value: string) => {
    setFormError(null);
    setSuccessMsg(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSameAddress = (checked: boolean) => {
    setSameAddress(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        cur_c_o: prev.res_c_o,
        cur_p_o: prev.res_p_o,
        cur_pin: prev.res_pin,
        cur_contact: prev.res_contact,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        cur_c_o: "",
        cur_p_o: "",
        cur_pin: "",
        cur_contact: "",
      }));
    }
  };

  const handleRegister = async () => {
    const requiredFields: { field: keyof ManualFormData; label: string }[] = [
      { field: "name", label: "Name" },
      { field: "gender", label: "Gender" },
      { field: "identification_mark", label: "Identification Mark" },
      { field: "institution_roll", label: "Institution Roll" },
      { field: "degree", label: "Degree" },
      { field: "branch", label: "Branch" },
      { field: "year_of_study", label: "Year of Study" },
      { field: "institution_name", label: "Institution Name" },
      { field: "guardian_name", label: "Guardian Name" },
      { field: "guardian_relation", label: "Relationship" },
      { field: "res_c_o", label: "Residential c/o" },
      { field: "res_p_o", label: "Residential p/o" },
      { field: "res_pin", label: "Residential Pin" },
      { field: "cur_c_o", label: "Current c/o" },
      { field: "cur_p_o", label: "Current p/o" },
      { field: "cur_pin", label: "Current Pin" },
      { field: "starting_date", label: "Starting Date" },
      { field: "no_of_days", label: "No. of Days" },
      { field: "section_posted", label: "Section Posted" },
    ];

    const missing = requiredFields.filter((f) => !formData[f.field].trim());
    if (missing.length > 0) {
      setFormError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    const days = Number(formData.no_of_days);
    if (isNaN(days) || days <= 0) {
      setFormError("Please enter a valid number of days.");
      return;
    }

    setRegistering(true);
    setFormError(null);

    const regId = generateRegId();

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('manual:register', {
        formData,
        registration_id: regId,
      })

      if (result.success) {
        setSuccessMsg(`Registered! ID: ${regId}`);
        setFormData({ ...EMPTY_FORM });
        setSameAddress(false);
      } else {
        setFormError(result.error || 'Registration failed.');
      }
    } catch (err) {
      setFormError(String(err));
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <PlusCircle size={24} /> Add Data
      </h2>
      <p className="mt-2 text-muted-foreground">
        Register a new intern or import data from an Excel file.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={20} /> Register Intern
          </CardTitle>
          <CardDescription>
            Fill in the details to register a new intern manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field>
                  <FieldLabel>Name *</FieldLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Gender *</FieldLabel>
                  <Select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Identification Mark *</FieldLabel>
                  <Input
                    value={formData.identification_mark}
                    onChange={(e) =>
                      handleChange("identification_mark", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Academic Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel>Institution Roll *</FieldLabel>
                  <Input
                    value={formData.institution_roll}
                    onChange={(e) =>
                      handleChange("institution_roll", e.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Degree *</FieldLabel>
                  <Input
                    value={formData.degree}
                    onChange={(e) => handleChange("degree", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Branch *</FieldLabel>
                  <Select
                    value={formData.branch}
                    onChange={(e) => handleChange("branch", e.target.value)}
                  >
                    <option value="">Select branch</option>
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Year of Study *</FieldLabel>
                  <Select
                    value={formData.year_of_study}
                    onChange={(e) =>
                      handleChange("year_of_study", e.target.value)
                    }
                  >
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Institution Name *</FieldLabel>
                  <Input
                    value={formData.institution_name}
                    onChange={(e) =>
                      handleChange("institution_name", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Guardian Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>Guardian Name *</FieldLabel>
                  <Input
                    value={formData.guardian_name}
                    onChange={(e) =>
                      handleChange("guardian_name", e.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Relationship *</FieldLabel>
                  <Input
                    value={formData.guardian_relation}
                    onChange={(e) =>
                      handleChange("guardian_relation", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Residential Address
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel>c/o *</FieldLabel>
                  <Input
                    value={formData.res_c_o}
                    onChange={(e) => handleChange("res_c_o", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>p/o *</FieldLabel>
                  <Input
                    value={formData.res_p_o}
                    onChange={(e) => handleChange("res_p_o", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Pin *</FieldLabel>
                  <Input
                    value={formData.res_pin}
                    onChange={(e) => handleChange("res_pin", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Email / Phone</FieldLabel>
                  <Input
                    value={formData.res_contact}
                    onChange={(e) =>
                      handleChange("res_contact", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Current Address
                </h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={sameAddress}
                    onCheckedChange={(checked) =>
                      handleSameAddress(checked === true)
                    }
                  />
                  <span className="text-muted-foreground">
                    Same as Residential
                  </span>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel>c/o *</FieldLabel>
                  <Input
                    value={formData.cur_c_o}
                    onChange={(e) => handleChange("cur_c_o", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>p/o *</FieldLabel>
                  <Input
                    value={formData.cur_p_o}
                    onChange={(e) => handleChange("cur_p_o", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Pin *</FieldLabel>
                  <Input
                    value={formData.cur_pin}
                    onChange={(e) => handleChange("cur_pin", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Email / Phone</FieldLabel>
                  <Input
                    value={formData.cur_contact}
                    onChange={(e) =>
                      handleChange("cur_contact", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Internship Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel>Starting Date *</FieldLabel>
                  <Input
                    type="date"
                    value={formData.starting_date}
                    onChange={(e) =>
                      handleChange("starting_date", e.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>No. of Days *</FieldLabel>
                  <Input
                    type="number"
                    value={formData.no_of_days}
                    onChange={(e) => handleChange("no_of_days", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Section Posted *</FieldLabel>
                  <Select
                    value={formData.section_posted}
                    onChange={(e) =>
                      handleChange("section_posted", e.target.value)
                    }
                  >
                    <option value="">Select section</option>
                    {SECTION_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            {successMsg && (
              <p className="text-sm text-green-600 font-medium">{successMsg}</p>
            )}

            <Button onClick={handleRegister} disabled={registering}>
              {registering ? "Registering..." : "Register"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ExcelImportCard />
    </div>
  );
}

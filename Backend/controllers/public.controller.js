import Centre from "../DBModels/Centre.js";
import Course from "../DBModels/Course.js";
import Setting from "../DBModels/Setting.js";

export function toPublicCourse(course, centres = new Map()) {
  return {
    slug: course.slug,
    code: course.code,
    title: course.title,
    lab: course.lab,
    level: course.level,
    duration: course.duration,
    summary: course.summary || "",
    centre: course.centre,
    centreName: centres.get(course.centre)?.name || "",
    centreAddress: centres.get(course.centre)?.address || "",
    feeUsd: course.feeUsdCents / 100,
    examFeeUsd: course.examFeeUsdCents / 100,
    examIncludedByInstitute: course.examIncludedByInstitute,
    batches: course.batches.map(({ id, label, timing, capacity, seatsAvailable }) => ({ id, label, timing, capacity, seatsAvailable })),
  };
}

export async function getSettings() {
  const settings = await Setting.findOne({ key: "site" }).lean();
  return { pkrPerUsd: settings?.pkrPerUsd ?? 277 };
}

const centreMap = async () => new Map((await Centre.find({}).lean()).map((c) => [c.code, c]));

export async function listCourses(_req, res) {
  const [courses, centres] = await Promise.all([Course.find({ published: true }).sort({ code: 1 }).lean(), centreMap()]);
  res.json({ success: true, data: courses.map((course) => toPublicCourse(course, centres)) });
}

export async function getCourse(req, res) {
  const course = await Course.findOne({ slug: String(req.params.slug).toLowerCase(), published: true }).lean();
  if (!course) return res.status(404).json({ success: false, message: "Course not found." });
  res.json({ success: true, data: toPublicCourse(course, await centreMap()) });
}

export async function publicSettings(_req, res) {
  res.json({ success: true, data: await getSettings() });
}

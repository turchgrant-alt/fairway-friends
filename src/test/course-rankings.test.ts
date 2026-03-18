import { describe, expect, it } from "vitest";

import {
  createEmptyCourseRankingState,
  getBucketCourses,
  markCoursePlayed,
  updateCourseRanking,
} from "@/lib/course-rankings";

describe("course ranking insertion order", () => {
  it("places a newly played course above an existing course when bucketOrder is 1", () => {
    let state = createEmptyCourseRankingState();
    state = markCoursePlayed(state, { courseId: "existing", bucket: "great", bucketOrder: 1 });
    state = markCoursePlayed(state, { courseId: "new", bucket: "great", bucketOrder: 1 });

    expect(getBucketCourses(state, "great").map((course) => course.courseId)).toEqual(["new", "existing"]);
  });

  it("places a newly played course below an existing course when bucketOrder is 2", () => {
    let state = createEmptyCourseRankingState();
    state = markCoursePlayed(state, { courseId: "existing", bucket: "great", bucketOrder: 1 });
    state = markCoursePlayed(state, { courseId: "new", bucket: "great", bucketOrder: 2 });

    expect(getBucketCourses(state, "great").map((course) => course.courseId)).toEqual(["existing", "new"]);
  });

  it("moves an already ranked course when it is reranked higher inside the same bucket", () => {
    let state = createEmptyCourseRankingState();
    state = markCoursePlayed(state, { courseId: "a", bucket: "great", bucketOrder: 1 });
    state = markCoursePlayed(state, { courseId: "b", bucket: "great", bucketOrder: 2 });
    state = markCoursePlayed(state, { courseId: "c", bucket: "great", bucketOrder: 3 });

    state = updateCourseRanking(state, { courseId: "c", bucket: "great", bucketOrder: 1 });

    expect(getBucketCourses(state, "great").map((course) => course.courseId)).toEqual(["c", "a", "b"]);
  });
});

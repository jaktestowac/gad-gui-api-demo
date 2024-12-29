const { RandomValueGeneratorWithSeed } = require("./random-data.generator");
const { logDebug } = require("../logger-api");
const { randomNames, randomSurnames, possibleSubjects } = require("./base.data");

const possibleClasses = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

function generateRandomStudent(dataGenerator, id) {
  if (dataGenerator === undefined) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const firstName = randomNames[dataGenerator.getNextValue(0, randomNames.length - 1)];
  const lastName = randomSurnames[dataGenerator.getNextValue(0, randomSurnames.length - 1)];
  const name = `${firstName} ${lastName}`;
  const studentId = id || dataGenerator.getNextValue(0, 1000);
  const age = dataGenerator.getNextValue(18, 26);
  return {
    name,
    id: studentId,
    age,
  };
}

function generateRandomSubject(dataGenerator, id) {
  if (dataGenerator === undefined) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const name = possibleSubjects[dataGenerator.getNextValue(0, possibleSubjects.length - 1)];
  const subjectId = id || dataGenerator.getNextValue(0, 1000);
  return {
    name,
    id: subjectId,
  };
}

function generateRandomClass(dataGenerator, id) {
  if (dataGenerator === undefined) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const name = possibleClasses[dataGenerator.getNextValue(0, possibleClasses.length - 1)];
  const classId = id || dataGenerator.getNextValue(0, 1000);
  return {
    name,
    id: classId,
  };
}

function generateRandomStudents(dataGenerator, minStudents, maxStudents) {
  if (dataGenerator === undefined) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const students = [];
  const studentCount = dataGenerator.getNextValue(minStudents, maxStudents);
  for (let i = 0; i < studentCount; i++) {
    students.push(generateRandomStudent(dataGenerator, i + 1));
  }
  return students;
}

function generateRandomSubjects(dataGenerator, minSubjects, maxSubjects) {
  if (dataGenerator === undefined) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const subjects = [];
  const subjectCount = dataGenerator.getNextValue(minSubjects, maxSubjects);
  for (let i = 0; i < subjectCount; i++) {
    subjects.push(generateRandomSubject(dataGenerator, i + 1));
  }
  return subjects;
}

function generateRandomClasses(dataGenerator, minClasses, maxClasses) {
  if (dataGenerator === undefined) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const classes = [];
  const classCount = dataGenerator.getNextValue(minClasses, maxClasses);
  for (let i = 0; i < classCount; i++) {
    classes.push(generateRandomClass(dataGenerator, i + 1));
  }
  return classes;
}

function generateRandomGrade(dataGenerator) {
  if (dataGenerator === undefined) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const grade = dataGenerator.getNextValueFloat(0, 5);
  return grade.toFixed(1);
}

function generateRandomStudentsInClasses(dataGenerator, students, classes) {
  if (dataGenerator === undefined) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const studentsInClasses = [];
  for (const _class of classes) {
    studentsInClasses.push({
      studentIds: [],
      classId: _class.id,
    });
  }

  for (const student of students) {
    const classGroup = studentsInClasses[dataGenerator.getNextValue(0, studentsInClasses.length - 1)];
    classGroup.studentIds.push(student.id);
  }
  return studentsInClasses;
}

function generateRandomGrades(dataGenerator, students, subjects) {
  if (dataGenerator === undefined) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const grades = [];
  for (const student of students) {
    const studentGrades = [];
    for (const subject of subjects) {
      const gradesCount = dataGenerator.getNextValue(0, 5);
      const grades = [];
      for (let i = 0; i < gradesCount; i++) {
        grades.push(generateRandomGrade(dataGenerator));
      }
      studentGrades.push({
        subjectId: subject.id,
        grades,
      });
    }
    grades.push({
      studentId: student.id,
      subjectGradesPair: studentGrades,
    });
  }

  return grades;
}

const _defaultOptions = {
  minStudents: 10,
  maxStudents: 30,
  minSubjects: 5,
  maxSubjects: 10,
  minClasses: 3,
  maxClasses: 5,
  seed: Math.random().toString(),
};

function generateRandomStudentsData(options) {
  const userOptions = options || _defaultOptions;
  const generatorOptions = { ..._defaultOptions, ...userOptions };

  logDebug("Generating random students data with options:", generatorOptions);

  const dataGenerator = new RandomValueGeneratorWithSeed(options.seed);
  const students = generateRandomStudents(dataGenerator, generatorOptions.minStudents, generatorOptions.maxStudents);
  const subjects = generateRandomSubjects(dataGenerator, generatorOptions.minSubjects, generatorOptions.maxSubjects);
  const classes = generateRandomClasses(dataGenerator, generatorOptions.minClasses, generatorOptions.maxClasses);
  const studentsInClasses = generateRandomStudentsInClasses(dataGenerator, students, classes);
  const grades = generateRandomGrades(dataGenerator, students, subjects);

  logDebug("Generated random students data:", {
    students: students.length,
    subjects: subjects.length,
    classes: classes.length,
  });

  return {
    students,
    subjects,
    classes,
    studentsInClasses,
    grades,
  };
}

module.exports = {
  generateRandomStudentsData,
};

/**
 * Content validation script using Zod v4.
 * Validates all static JSON content files against their schemas.
 * Run with: npx tsx src/lib/validate-content.ts
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// ─── Schemas ────────────────────────────────────────────────────────────────

const KeywordReferenceSchema = z.object({
  term: z.string().min(1),
  type: z.enum(['exam-signal', 'service-reference', 'architecture-term']),
  definition: z.string().min(1),
  svgDiagram: z.string().optional(),
});

const TopicContentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sectionId: z.string().min(1),
  clusterId: z.string().min(1),
  order: z.number().int().positive(),
  explanation: z.string().min(10),
  analogy: z.string().min(10),
  diagram: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1),
  examKeywords: z.array(KeywordReferenceSchema),
  commonMistakes: z.array(z.string().min(1)),
  relatedTopics: z.array(z.string().min(1)),
});

const QuizOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  topicId: z.string().min(1),
  question: z.string().min(1),
  options: z.array(QuizOptionSchema).length(4),
  correctOptionId: z.string().min(1),
  explanation: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

const QuizPoolSchema = z.array(QuizQuestionSchema).min(3);

const ExpectedConnectionSchema = z.object({
  sourceType: z.string().min(1),
  targetType: z.string().min(1),
  connectionTypeId: z.string().min(1),
});

const DiagramTaskSchema = z.object({
  id: z.string().min(1),
  clusterId: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(10),
  requiredComponents: z.array(z.string().min(1)).min(1),
  hints: z.array(z.string().min(1)).min(1),
  expectedConnections: z.array(ExpectedConnectionSchema).optional(),
});

const RubricWeightsSchema = z
  .object({
    correctness: z.number().min(0).max(1),
    connectivity: z.number().min(0).max(1),
    security: z.number().min(0).max(1),
    bestPractices: z.number().min(0).max(1),
  })
  .refine(
    (w) => Math.abs(w.correctness + w.connectivity + w.security + w.bestPractices - 1.0) < 0.001,
    { message: 'Rubric weights must sum to 1.0' }
  );

const CapstoneChallengeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  scenario: z.string().min(10),
  requirements: z.array(z.string().min(1)).min(1),
  rubricWeights: RubricWeightsSchema,
});

const FlashcardSchema = z.object({
  id: z.string().min(1),
  topicId: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  category: z.string().min(1),
});

const FlashcardsArraySchema = z.array(FlashcardSchema).min(30);

const GlossaryEntrySchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  definition: z.string().min(1),
  category: z.enum(['exam-term', 'service', 'architecture-pattern']),
  relatedTopics: z.array(z.string().min(1)),
});

const GlossaryArraySchema = z.array(GlossaryEntrySchema).min(30);

const KeywordTooltipSchema = z.object({
  term: z.string().min(1),
  type: z.enum(['exam-signal', 'service-reference', 'architecture-term']),
  definition: z.string().min(1),
  svgDiagram: z.string().optional(),
});

const KeywordsArraySchema = z.array(KeywordTooltipSchema).min(20);

const ClusterSchema = z.object({
  id: z.string().min(1),
  topicIds: z.array(z.string().min(1)).min(2).max(3),
  diagramTaskId: z.string().min(1),
});

const SectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  clusters: z.array(ClusterSchema).min(1),
  sectionQuizId: z.string().min(1),
  capstoneIds: z.array(z.string().min(1)).min(1),
});

const ProgressionConfigSchema = z.object({
  sections: z.array(SectionSchema).min(1),
});

const SectionQuizSchema = z.array(QuizQuestionSchema).length(20);

// ─── Validation Runner ──────────────────────────────────────────────────────

interface ValidationResult {
  file: string;
  status: 'pass' | 'fail';
  errors?: string[];
}

const results: ValidationResult[] = [];
const contentDir = path.resolve(__dirname, '../content');

function readJson(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function validateFile(filePath: string, schema: z.ZodType, label: string): void {
  const relativePath = path.relative(contentDir, filePath);
  try {
    const data = readJson(filePath);
    const result = schema.safeParse(data);
    if (result.success) {
      results.push({ file: relativePath, status: 'pass' });
    } else {
      const errors = result.error.issues.map(
        (issue) => `  [${issue.path.join('.')}] ${issue.message}`
      );
      results.push({ file: relativePath, status: 'fail', errors });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ file: relativePath, status: 'fail', errors: [`  Parse error: ${message}`] });
  }
}

function validateDirectory(
  dirPath: string,
  schema: z.ZodType,
  label: string,
  fileFilter?: (name: string) => boolean
): void {
  if (!fs.existsSync(dirPath)) {
    results.push({ file: dirPath, status: 'fail', errors: [`  Directory not found: ${dirPath}`] });
    return;
  }
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
  const filtered = fileFilter ? files.filter(fileFilter) : files;
  for (const file of filtered) {
    validateFile(path.join(dirPath, file), schema, label);
  }
}

// ─── Run Validation ─────────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          QualCheck Content Validation                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 1. Topics
console.log('▸ Validating topics...');
validateDirectory(path.join(contentDir, 'topics'), TopicContentSchema, 'Topic');

// 2. Quizzes
console.log('▸ Validating quiz pools...');
validateDirectory(path.join(contentDir, 'quizzes'), QuizPoolSchema, 'Quiz Pool');

// 3. Diagrams
console.log('▸ Validating diagram tasks...');
validateDirectory(path.join(contentDir, 'diagrams'), DiagramTaskSchema, 'Diagram Task');

// 4. Section Quiz
console.log('▸ Validating section quiz...');
validateFile(path.join(contentDir, 'section-quiz.json'), SectionQuizSchema, 'Section Quiz');

// 5. Capstone Challenges
console.log('▸ Validating capstone challenges...');
validateDirectory(path.join(contentDir, 'capstone'), CapstoneChallengeSchema, 'Capstone');

// 6. Flashcards
console.log('▸ Validating flashcards...');
validateFile(path.join(contentDir, 'flashcards.json'), FlashcardsArraySchema, 'Flashcards');

// 7. Glossary
console.log('▸ Validating glossary...');
validateFile(path.join(contentDir, 'glossary.json'), GlossaryArraySchema, 'Glossary');

// 8. Keywords
console.log('▸ Validating keywords...');
validateFile(path.join(contentDir, 'keywords.json'), KeywordsArraySchema, 'Keywords');

// 9. Progression
console.log('▸ Validating progression...');
validateFile(path.join(contentDir, 'progression.json'), ProgressionConfigSchema, 'Progression');

// ─── Cross-Validation ───────────────────────────────────────────────────────

console.log('▸ Running cross-validation checks...');

try {
  const progression = readJson(path.join(contentDir, 'progression.json')) as {
    sections: Array<{
      id: string;
      clusters: Array<{ id: string; topicIds: string[]; diagramTaskId: string }>;
      capstoneIds: string[];
    }>;
  };

  // Check all topic IDs in progression have corresponding topic files
  const topicDir = path.join(contentDir, 'topics');
  const topicFiles = fs.readdirSync(topicDir).filter((f) => f.endsWith('.json'));
  const topicFileIds = topicFiles.map((f) => f.replace('.json', ''));

  for (const section of progression.sections) {
    for (const cluster of section.clusters) {
      for (const topicId of cluster.topicIds) {
        if (!topicFileIds.includes(topicId)) {
          results.push({
            file: 'cross-validation',
            status: 'fail',
            errors: [`  Topic "${topicId}" referenced in progression but no file found`],
          });
        }
      }

      // Check diagram task file exists
      const diagramFile = path.join(contentDir, 'diagrams', `${cluster.diagramTaskId}.json`);
      if (!fs.existsSync(diagramFile)) {
        results.push({
          file: 'cross-validation',
          status: 'fail',
          errors: [
            `  Diagram task "${cluster.diagramTaskId}" referenced in progression but no file found`,
          ],
        });
      }
    }

    // Check capstone files exist
    for (const capstoneId of section.capstoneIds) {
      const capstoneFile = path.join(contentDir, 'capstone', `${capstoneId}.json`);
      if (!fs.existsSync(capstoneFile)) {
        results.push({
          file: 'cross-validation',
          status: 'fail',
          errors: [
            `  Capstone "${capstoneId}" referenced in progression but no file found`,
          ],
        });
      }
    }
  }

  // Check quiz files exist for all topics
  const quizDir = path.join(contentDir, 'quizzes');
  for (const topicId of topicFileIds) {
    const quizFile = path.join(quizDir, `${topicId}.json`);
    if (!fs.existsSync(quizFile)) {
      results.push({
        file: 'cross-validation',
        status: 'fail',
        errors: [`  Quiz pool missing for topic "${topicId}"`],
      });
    }
  }

  // Check total topic count
  const totalTopics = progression.sections.reduce(
    (sum, s) => sum + s.clusters.reduce((cs, c) => cs + c.topicIds.length, 0),
    0
  );
  if (totalTopics !== 18) {
    results.push({
      file: 'cross-validation',
      status: 'fail',
      errors: [`  Expected 18 topics in progression, found ${totalTopics}`],
    });
  }

  // If no cross-validation errors were added, mark as pass
  const crossErrors = results.filter(
    (r) => r.file === 'cross-validation' && r.status === 'fail'
  );
  if (crossErrors.length === 0) {
    results.push({ file: 'cross-validation', status: 'pass' });
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  results.push({
    file: 'cross-validation',
    status: 'fail',
    errors: [`  Error during cross-validation: ${message}`],
  });
}

// ─── Print Results ──────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                        RESULTS');
console.log('═══════════════════════════════════════════════════════════════\n');

const passed = results.filter((r) => r.status === 'pass');
const failed = results.filter((r) => r.status === 'fail');

for (const result of results) {
  const icon = result.status === 'pass' ? '✓' : '✗';
  const color = result.status === 'pass' ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${icon}\x1b[0m ${result.file}`);
  if (result.errors) {
    for (const error of result.errors) {
      console.log(`\x1b[31m${error}\x1b[0m`);
    }
  }
}

console.log('\n───────────────────────────────────────────────────────────────');
console.log(`Total: ${results.length} | Passed: ${passed.length} | Failed: ${failed.length}`);
console.log('───────────────────────────────────────────────────────────────\n');

if (failed.length > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✓ All content validation checks passed!\x1b[0m\n');
  process.exit(0);
}

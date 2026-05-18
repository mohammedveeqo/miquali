import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TopicContent, KeywordReference } from '@/types';

/** Props for the TopicPage component */
export interface TopicPageProps {
  /** The full topic content loaded from static JSON */
  topic: TopicContent;
}

/**
 * Renders a keyword as a styled span based on its type.
 * In task 7.2, this will be replaced by the full KeywordTooltip component.
 */
function KeywordHighlight({ keyword }: { keyword: KeywordReference }) {
  const styleMap: Record<KeywordReference['type'], string> = {
    'exam-signal': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'service-reference': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    'architecture-term': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  };

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border ${styleMap[keyword.type]}`}
      title={keyword.definition}
      role="term"
      aria-label={`${keyword.term}: ${keyword.definition}`}
    >
      {keyword.term}
    </span>
  );
}

/**
 * TopicPage — Server component that renders all structured content sections
 * for a single topic: breadcrumb, title, explanation (markdown), analogy,
 * diagram, key points, exam keywords, common mistakes, and related topics.
 *
 * Validates: Requirements 1.1, 1.4
 */
export function TopicPage({ topic }: TopicPageProps) {
  return (
    <main className="flex min-h-screen flex-col px-4 py-8 sm:px-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="capitalize">{topic.sectionId}</li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground font-medium">{topic.title}</li>
        </ol>
      </nav>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-8">
        {topic.title}
      </h1>

      {/* Explanation (Markdown) */}
      <section aria-labelledby="explanation-heading" className="mb-8">
        <h2 id="explanation-heading" className="sr-only">
          Explanation
        </h2>
        <div className="prose prose-invert prose-sm max-w-none text-foreground/90 leading-relaxed">
          <ReactMarkdown>{topic.explanation}</ReactMarkdown>
        </div>
      </section>

      {/* Analogy Card */}
      <Card className="mb-8 border-l-4 border-l-amber-500 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-amber-400 flex items-center gap-2">
            <span aria-hidden="true">💡</span>
            Analogy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {topic.analogy}
          </p>
        </CardContent>
      </Card>

      {/* ASCII Diagram */}
      {topic.diagram && (
        <section aria-labelledby="diagram-heading" className="mb-8">
          <h2
            id="diagram-heading"
            className="text-lg font-semibold text-foreground mb-3"
          >
            Diagram
          </h2>
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <pre
                className="text-xs sm:text-sm font-mono text-foreground/90 overflow-x-auto whitespace-pre leading-relaxed"
                aria-label={`Architecture diagram for ${topic.title}`}
                role="img"
              >
                {topic.diagram}
              </pre>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Tabs: Key Points | Exam Keywords | Common Mistakes */}
      <section aria-labelledby="details-heading" className="mb-8">
        <h2 id="details-heading" className="sr-only">
          Topic Details
        </h2>
        <Tabs defaultValue="key-points" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="key-points">Key Points</TabsTrigger>
            <TabsTrigger value="exam-keywords">Exam Keywords</TabsTrigger>
            <TabsTrigger value="common-mistakes">Common Mistakes</TabsTrigger>
          </TabsList>

          {/* Key Points Tab */}
          <TabsContent value="key-points">
            <Card>
              <CardContent className="pt-6">
                <ul
                  className="space-y-3"
                  role="list"
                  aria-label="Key points"
                >
                  {topic.keyPoints.map((point, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-foreground/90"
                    >
                      <span
                        className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exam Keywords Tab */}
          <TabsContent value="exam-keywords">
            <Card>
              <CardContent className="pt-6">
                <div
                  className="flex flex-wrap gap-3"
                  role="list"
                  aria-label="Exam keywords"
                >
                  {topic.examKeywords.map((keyword) => (
                    <KeywordHighlight key={keyword.term} keyword={keyword} />
                  ))}
                </div>
                {topic.examKeywords.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {topic.examKeywords.map((keyword) => (
                      <div
                        key={`def-${keyword.term}`}
                        className="border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <KeywordHighlight keyword={keyword} />
                        </div>
                        <p className="text-sm text-muted-foreground pl-1">
                          {keyword.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Common Mistakes Tab */}
          <TabsContent value="common-mistakes">
            <Card>
              <CardContent className="pt-6">
                <ul
                  className="space-y-3"
                  role="list"
                  aria-label="Common mistakes"
                >
                  {topic.commonMistakes.map((mistake, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-foreground/90"
                    >
                      <span
                        className="mt-0.5 text-destructive shrink-0"
                        aria-hidden="true"
                      >
                        ⚠
                      </span>
                      {mistake}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Related Topics */}
      {topic.relatedTopics.length > 0 && (
        <section aria-labelledby="related-heading" className="mb-8">
          <h2
            id="related-heading"
            className="text-lg font-semibold text-foreground mb-3"
          >
            Related Topics
          </h2>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Related topics">
            {topic.relatedTopics.map((relatedId) => (
              <Link
                key={relatedId}
                href={`/topics/${relatedId}`}
                role="listitem"
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/60 transition-colors capitalize"
                >
                  {relatedId.replace(/-/g, ' ')}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

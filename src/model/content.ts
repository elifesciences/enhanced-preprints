/*
 * The Encoda JSON process converts various JATS input into structures that are either a string, a structure with a type
 * and content or an array that contains any of the above.
 * I guess in theory this can be infinitely deep, so recursively converting this to text to use it more
 * easily.
 *
 * examples:
 * - "a string"
 * - ["a", "string"]
 * - {"type":"emphasis", "content":"a"}
 * - {"type":"emphasis", "content":["a"]}
 * - [{"type":"emphasis", "content":["a"]}, "string"]
 *
 * See tests for more examples
 */

import { logger } from '../utils/logger';

type DecoratedContent = {
  content: string | string[],
  type: string,
};

export type HeadingContent = DecoratedContent & {
  type: 'Heading',
  id: string,
  depth: number,
};

export type EmphasisContent = DecoratedContent & {
  type: 'Emphasis',
  depth: number,
};

type ContentPart = string | DecoratedContent | HeadingContent | EmphasisContent;
export type Content = ContentPart | ContentPart[];

export const contentToHtml = (content: Content): string => {
  if (typeof content === 'undefined') {
    return '';
  }
  if (typeof content === 'string') {
    try {
      const decodedContent = JSON.parse(content);
      return contentToHtml(decodedContent);
    } catch (error) {
      // just an ordinary string
      return content;
    }
  }

  // array of string or DecoratedContent, so just map back to this function
  if (Array.isArray(content)) {
    const contentParts = content.map(contentToHtml);
    return contentParts.join('');
  }
  switch (content.type) {
    case 'Emphasis':
      return `<em>${contentToHtml(content.content)}</em>`;
    case 'Strong':
      return `<strong>${contentToHtml(content.content)}</strong>`;
    case 'Article':
    case 'Include':
    case 'Heading':
    case 'Paragraph':
    case 'QuoteBlock':
    case 'Cite':
    case 'CiteGroup':
    case 'CodeBlock':
    case 'CodeChunk':
    case 'CodeExpression':
    case 'CodeFragment':
    case 'Person':
    case 'CreativeWork':
    case 'Periodical':
    case 'PublicationIssue':
    case 'PublicationVolume':
    case 'SoftwareSourceCode':
    case 'MediaObject':
    case 'Collection':
    case 'Figure':
    case 'List':
    case 'ListItem':
    case 'Table':
    case 'TableRow':
    case 'TableCell':
    case 'Datatable':
    case 'Date':
    case 'ThematicBreak':
    case 'Organization':
    case 'Mark':
    case 'Delete':
    case 'Superscript':
    case 'Subscript':
    case 'Link':
    case 'Quote':
    case 'MathBlock':
    case 'MathFragment':
    case 'AudioObject':
    case 'ImageObject':
    case 'VideoObject':
    default:
      logger.warn(`Unimplemented code block: ${content.type}`);
      return contentToHtml(content.content);
  }
};

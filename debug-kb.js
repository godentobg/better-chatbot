// Debug script to test knowledge base functionality
import { knowledgeBaseRepository } from './dist/lib/db/repository.js';
import { buildKnowledgeBaseContext } from './dist/lib/ai/knowledge-base-context.js';

async function testKnowledgeBase() {
  try {
    console.log('Testing knowledge base functionality...');
    
    // Test 1: List all knowledge bases for user
    console.log('\n=== Test 1: List Knowledge Bases ===');
    const kbList = await knowledgeBaseRepository.findByUserId('some-user-id');
    console.log('Knowledge bases found:', kbList.length);
    
    if (kbList.length > 0) {
      console.log('First KB:', kbList[0]);
      
      // Test 2: Get files for the first knowledge base
      console.log('\n=== Test 2: Get Files ===');
      const files = await knowledgeBaseRepository.findFiles(kbList[0].id, kbList[0].userId);
      console.log('Files found:', files.length);
      
      if (files.length > 0) {
        console.log('First file:', {
          id: files[0].id,
          filename: files[0].filename,
          originalName: files[0].originalName,
          contentLength: files[0].content ? files[0].content.length : 0,
          hasContent: !!files[0].content
        });
        
        // Test 3: Search content
        console.log('\n=== Test 3: Search Content ===');
        const searchResults = await knowledgeBaseRepository.searchContent('user', kbList[0].userId);
        console.log('Search results:', searchResults.length);
        
        if (searchResults.length > 0) {
          console.log('First search result:', {
            filename: searchResults[0].file.originalName,
            relevantContentLength: searchResults[0].relevantContent.length,
            relevantContentPreview: searchResults[0].relevantContent.substring(0, 200)
          });
        }
        
        // Test 4: Build knowledge base context
        console.log('\n=== Test 4: Build Context ===');
        const context = await buildKnowledgeBaseContext('user manual', kbList[0].userId);
        console.log('Context length:', context.length);
        console.log('Context preview:', context.substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('Error testing knowledge base:', error);
  }
}

testKnowledgeBase();

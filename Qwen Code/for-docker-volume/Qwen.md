# Qwen.md

It has to be set in the specific projects, where "qwen" is executed.  

General points:

- Project architecture & key files
- Coding standards & conventions
- Preferred libraries/frameworks
- Testing/deployment workflows
- Things to avoid or always remember
- Team-specific rules or context

## Project Architecture & Key Files
- Follow established architectural patterns for the technology stack
- Maintain clear separation of concerns between components
- Document key files and their purposes in README files
- Use consistent naming conventions for files and directories
- Structure projects according to platform best practices

## Coding Standards & Conventions
- Use meaningful variable and function names
- Write clear, concise comments for complex logic
- Implement proper error handling and logging
- Apply SOLID principles where applicable

## Preferred Libraries/Frameworks
- Use well-maintained, actively developed libraries
- Prioritize libraries with strong community support
- Consider performance implications when selecting libraries
- Maintain a curated list of approved dependencies
- Keep dependencies up-to-date with security patches

## Testing/Deployment Workflows
- Implement comprehensive unit, integration, and end-to-end testing
- Follow test-driven development (TDD) or behavior-driven development (BDD) practices
- Automate testing and deployment through CI/CD pipelines
- Maintain separate environments for development, staging, and production
- Implement proper monitoring and alerting systems

## Things to Avoid or Always Remember
- Don't hardcode sensitive information (use environment variables or secure vaults)
- Always validate user inputs to prevent injection attacks
- Don't commit secrets or credentials to version control
- Remember to handle edge cases in your code
- Always clean up resources properly (memory, connections, etc.)

## Team-Specific Rules or Context
- Follow the team's established branching strategy (e.g., Git Flow)
- Submit code for peer review before merging
- Maintain code coverage metrics
- Participate in regular code reviews and retrospectives
- Keep documentation updated with code changes

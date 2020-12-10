import {reporters} from 'mocha';
import {TestRail} from "./testrail";
import {titleToCaseIds} from "./shared";
import {Status, TestRailResult} from "./testrail.interface";


export class MochaTestRailReporter extends reporters.Spec {
    private results: TestRailResult[] = [];
    private testRail: TestRail;

    constructor(runner: any, options: any) {
        super(runner);

        let reporterOptions = options.reporterOptions;

        this.testRail = new TestRail(reporterOptions);
        this.validate(reporterOptions, 'domain');
        this.validate(reporterOptions, 'username');
        this.validate(reporterOptions, 'password');
        this.validate(reporterOptions, 'projectId');
        this.validate(reporterOptions, 'runId');

        runner.on('pass', test => {
            const caseIds = titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                const results = caseIds.map(caseId => {
                    return {
                        case_id: caseId,
                        status_id: Status.Passed,
                        comment: `Execution time: ${test.duration}ms`,
                        elapsed: `${test.duration/1000}s`
                    };
                });
                this.results.push(...results);
            }
        });

        runner.on('fail', test => {
            const caseIds = titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                const results = caseIds.map(caseId => {
                    return {
                        case_id: caseId,
                        status_id: Status.Failed,
                        comment: `${test.err.message}`,
                    };
                });
                this.results.push(...results);
            }
        });

        runner.on('end', () => {
            // publish test cases results & close the run
            this.testRail.publishResults(this.results)
        });
    }

    private validate(options, name: string) {
        if (options == null) {
            throw new Error('Missing reporterOptions in .mocharc.yml');
        }
        if (options[name] == null) {
            throw new Error(`Missing ${name} value. Please update reporterOptions in .mocharc.yml`);
        }
    }
}

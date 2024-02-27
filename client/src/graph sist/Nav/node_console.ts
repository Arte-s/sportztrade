///<reference no-default-lib="true"/>
///<reference lib="esnext"/>
///<reference types="node"/>

export {};


type CallSite = { getLineNumber() :number; getFileName() :string; getFunctionName() :string; getColumnNumber() :number; }

let wrapCallSite : ((frame :CallSite)=>CallSite) | undefined; //  ((position :Position)=>Position) | undefined;


// @ts-ignore
declare var self : unknown;
// @ts-ignore
declare var window : unknown;

//console.log("!!!!!",typeof self, typeof window);

if (1)
if (1 && typeof self != 'object' && typeof window!="object") { // если запущено на node.js

    try {
        require('source-map-support').install();
        wrapCallSite = require('source-map-support').wrapCallSite; //.mapSourcePosition;
    }
    catch {
        //console.error("!!!!");
    }

    for(let methodName of ['debug', 'log', 'warn', 'error'] as (keyof typeof console)[]) {
        const originalLoggingMethod = console[methodName] as typeof console.log; //any;

        console[methodName] = ((firstArgument? :any, ...otherArguments :any[]) => {
            const originalPrepareStackTrace = Error.prepareStackTrace;
            Error.prepareStackTrace = (_, stack) => stack;
            type MyError= { stack: CallSite[]}
            let callee = (new Error() as unknown as MyError).stack[1];
            if (!callee) return;
            if (wrapCallSite) callee= wrapCallSite(callee);

            Error.prepareStackTrace = originalPrepareStackTrace;
            const fileName = callee.getFileName(); //path.relative(process.cwd(), callee.getFileName());
            if (fileName.includes("source-map-support")) { originalLoggingMethod(firstArgument, ...otherArguments);  return; }
            let fileAndLine = `${fileName}:${callee.getLineNumber()}:${callee.getColumnNumber()}  `+callee.getFunctionName();
            fileAndLine = fileAndLine.replaceAll("\\","/");

            if (! fileAndLine.toLowerCase().startsWith("file:///")) fileAndLine= "file:///" + fileAndLine;
            if (1)
                originalLoggingMethod(firstArgument, ...otherArguments, "",fileAndLine);
            else
            if (typeof firstArgument === 'string') {
                originalLoggingMethod(fileAndLine + ' ' + firstArgument, ...otherArguments);
            } else {
                originalLoggingMethod(fileAndLine, firstArgument, ...otherArguments);
            }
        }) as any;
    }
}

// // Tests:
// console.log('%s %d', 'hi', 42);
// console.log({ a: 'foo', b: 'bar'});
// throw new Error("Errrrrr");


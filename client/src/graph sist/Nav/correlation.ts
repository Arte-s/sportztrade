///@@@<reference lib="dom"/>

export function corr(d1: readonly number[], d2 :readonly number[], max?: number) {
    const { min, pow, sqrt } = Math;
    const add = (a: number, b: number) => a + b;
    const n = min(d1.length, d2.length, max??d2.length);
    if (n == 0)  return 0;
    const start = (max) ? (n-max>0? n-max: 0): 0;
    [d1, d2] = [d1.slice(start, start+n), d2.slice(start, start+n)];
    const [sum1, sum2] = [d1, d2].map(l => l.reduce(add));
    const [pow1, pow2] = [d1, d2].map(l => l.reduce((a, b) => a + pow(b, 2), 0));
    const mulSum = d1.map((n, i) => n * d2[i]).reduce(add);
    const dense = sqrt((pow1 - pow(sum1, 2) / n) * (pow2 - pow(sum2, 2) / n));
    if (dense == 0)  return 0;
    return (mulSum - (sum1 * sum2 / n)) / dense;
}


export function corr2(array1 :readonly number[], array2 :readonly number[]) :number;
export function corr2(array1 :readonly number[], array2 :readonly number[], pos1 :number, pos2 :number, count :number) :number;

//------------- Расчёт корреляции двух массивов ---------------------------------
export function corr2(array1 :readonly number[], array2 :readonly number[], pos1 :number=0, pos2 :number=0, count=-1)
{
  if (count==0) return 0;
  if (count<0) count= Math.min(array1.length-pos1, array2.length-pos2);
  let sum1=0, sum2=0;
  for (let i=0; i<count; i++)  { sum1 += array1[pos1+i];  sum2 += array2[pos2+i]; }

  const avrg1= sum1 / count;
  const avrg2= sum2 / count;
  let sum11=0, sum22=0, sum12=0;

  for (let i=0;  i<count;  i++)
  {
    const delta1= array1[pos1+i]-avrg1;
    const delta2= array2[pos2+i]-avrg2;
    sum11 += delta1 * delta1;
    sum22 += delta2 * delta2;
    sum12 += delta1 * delta2;
  }
  if (sum11==0 || sum22==0) return(0);
  const k = sum12 / Math.sqrt(sum11 * sum22);
  return k;
}


function testCorrelations() {
    let arr1= [1,5,7,3,7,8,4,6,7,3,2];
    let arr2= [8,4,8,5,6,4,7,8,0,3,8];
    let c1= corr(arr1,arr2);
    let c2= corr2(arr1,arr2);
    console.log("Correlations: ",c1, c2);
}

testCorrelations();
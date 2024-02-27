
���� TesterAPI.ts
==================


������ ����� (�����������):

  export async function RunTest(info :Readonly<CTesterInfo>,  onTick :(testerTick :TesterTick, indicators? :readonly IIndicator[], percent? :number)=>Promise<boolean|void>)  :   Promise<CTradeHistory|null>;

 ��� info   - �������� ���� � ������������ (������������)

     onTick - ���������� ������� ���� (�����������),
              ��� TesterTick - ���������� ��� �������,
                  indicators - ������������ ���������� (����� ������ �� �������� ��� �������� ����)
                  percent - ������� ����������

 ������������ ��������: TradeHistory (������� ������)

��� ���� ���������� �������������� �������� ������� �� �������������� ������� ��� �������������.



export class CTesterInfo
{
	symInfo :CSymbolInfo;      // ���� �� �������
	strategy :IStrategy;       // ���������
	strategyParams: number[];  // �������� ���������� ���������
	tf :TF;                    // ���������
	config :CTesterConfig;     // ������������ �������
}



��������� ���������:

export interface IStrategy
{
	readonly name : string;                  // ��� ���������
	readonly params : readonly ParamInfo[];  // ���� � ���������� ���������

	getTrader?(params : readonly number[]) : ITrader;   // �������� �������� ��� �������� ���������� ��������� (� ������� ������ �� ������������!)

	getSignaller(params : readonly number[]) : IStrategySignaller;  // �������� ���������� (������������ ��� ��������� ������� �������� �� �������/�������)
}


��������� ����������:


export interface IStrategySignaller
{
	onNewBars(bars: readonly CBar[]) : void;     // ���������� ������� ��������� ����� �����
	getSignal() : number|null;                   // ������� ������
	readonly indicators : readonly IIndicator[]; // ������������ ����������
	readonly minRequiredDepthBars? :number;      // ����������� ��������� ����� ����� (�������) ��� �������
}





#include<bits/stdc++.h>
using namespace std;


int main() {
	int arr[6]={10,20,50,100,200,2000};
	srand(time(NULL));
	int x=(rand())%6;
	cout<<arr[x];
	return 0;
}
